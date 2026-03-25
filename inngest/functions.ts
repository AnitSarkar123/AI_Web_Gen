import { Sandbox } from "@e2b/code-interpreter";
import { inngest } from "./client";
import { createAgent, createTool, TextMessage, createNetwork, Tool, createState, openai, gemini, Message } from "@inngest/agent-kit";
import { getSandbox, toProjectPath } from "@/lib/sandbox";
import z from "zod";
import { PROMPT, TITLE_PROMPT } from "./prompt";
import { db } from "@/lib/db";
import { extractDesignSpecFromImage } from "@/lib/extract-design-spec";
import { searchUnsplashPhoto, UnsplashAttribution } from "@/lib/unsplash";
// import { Public } from "@prisma/client/runtime/library";
import { channel, topic } from "@inngest/realtime";
// import { Project } from '../lib/generated/prisma/client';
import { SortOrder } from '../lib/generated/prisma/internal/prismaNamespace';
import { de } from "date-fns/locale";
interface codeAgentState {
  summary?: string;
  files?: Record<string, string>;
}
export const userChannel = channel("project").addTopic(
  topic("projectInfo").type<string>()
)
export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/codeAgent.run" },
  async ({ event, step, publish }) => {
    const sandboxId = await step.run("get-or-Create Sandbox", async () => {
      const Project = await db.project.findUnique({
        where: { id: event.data.projectId },
        select: { sandboxId: true }
      })
      if (Project?.sandboxId) {
        const sandbox = await Sandbox.connect(Project.sandboxId, {
          timeoutMs: 15 * 60 * 1000,
        });

        return sandbox.sandboxId;
      }

      const createdSandbox = await Sandbox.create("forgeai-v1", { timeoutMs: 15 * 60 * 1000 });
      await db.project.update({
        where: { id: event.data.projectId },
        data: { sandboxId: createdSandbox.sandboxId },
      });
      return createdSandbox.sandboxId;
    });
    const getPreviousMessages = await step.run('get-previous-messages', async () => {
      const messages = await db.message.findMany({
        where: { projectId: event.data.projectId },
        orderBy: { updatedAt: "desc" },
        take: 10,
      });
      const lastMessages = messages.map((message) => {
        return {
          type: 'text',
          role: message.role === "ASSISTANT" ? "assistant" : "user",
          content: message.content,
        }

      }).reverse()
      // return messages;
      return lastMessages as Message[];
    });
    const getPreviousCodeFiles = await step.run('get-previous-code-files', async () => {
      const lastMessages = await db.message.findFirst({
        where: {
          projectId: event.data.projectId,
          codeFragment: {
            isNot: null
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          codeFragment: true
        }


      });
      return (lastMessages?.codeFragment?.files as Record<string, string>) || {};


    });
    const CodingAgentState = createState<codeAgentState>({
      summary: "",
      files: getPreviousCodeFiles,

    },

      { messages: getPreviousMessages },
    )
    const metadataAgent = createAgent({
      name: "Forge AI Project namer Agent",
      system: "You are an assistant that generates a concise and descriptive project name based on the conversation and code files. The project name should be 2-4 words, catchy, and reflect the main theme or functionality of the project.",
      description: "An agent to generate project name",
      model: gemini({
        model: 'gemini-2.5-flash',
        apiKey: process.env.GEMINI_API_KEY,
      }),
    })
    const runNamingAgent = async (prompt: string) => {
      const result = await metadataAgent.run(prompt);
      const last = result.output.findLast((message) => message.role === "assistant") as TextMessage | undefined;
      const projectName = last?.content ? (typeof last.content === "string" ? last.content : last.content.map((c) => c.text).join("")) : "Untitled Project";
      return projectName.replace(/[^a-zA-Z0-9\s\-]/g, "").trim().slice(0, 50) || "Untitled Project";
    }



    const codeAgent = createAgent({
      name: 'coding agent',
      system: PROMPT,
      description: 'An expert coding agent',
      model: gemini({
        model: 'gemini-2.5-flash',
        apiKey: process.env.GEMINI_API_KEY,

      }),
      tools: [
        createTool({
          name: 'terminal',
          description: 'Use terminal to run commands',
          parameters: z.object({
            command: z.string().describe('the command to run in the terminal')
          }),
          handler: async ({ command }) => {
            await publish(
              await userChannel().projectInfo("installing packages inside terminal...")
            )
            const buffers = { stdout: "", stderr: "" }

            try {
              const sandbox = await getSandbox(sandboxId);
              const results = await sandbox.commands.run(command, {
                onStdout: (data: string) => {
                  buffers.stdout += data;
                },
                onStderr: (data: string) => {
                  buffers.stderr += data;
                }
              })
              return results.stdout;

            }
            catch (e) {
              console.error(`Command failed:${e} \nstdout: ${buffers.stdout}\nstderr:${buffers.stderr}`);
              return `Command failed:${e} \nstdout: ${buffers.stdout}\nstderr:${buffers.stderr}`;

            }
          }
        }),
        createTool({
          name: "listFiles",
          description: "List files in a directory inside the sandbox",
          parameters: z.object({
            path: z.string().default(".").describe("Directory path to list"),
            recursive: z.boolean().default(true),
            maxDepth: z.number().int().min(1).max(10).default(4),
          }),
          handler: async ({ path, recursive, maxDepth }) => {
            await publish(
              await userChannel().projectInfo("Listing Files ...")
            )
            try {
              const sandbox = await getSandbox(sandboxId);
              const target = toProjectPath(path);

              const cmd = recursive
                ? `find "${target}" -maxdepth ${maxDepth} -type f`
                : `find "${target}" -maxdepth 1 -type f`;

              const res = await sandbox.commands.run(cmd);
              return res.stdout || "";
            } catch (e) {
              return `Error listing files: ${e}`;
            }
          },
        }),
        createTool({
          name: 'createOrUpdateFiles',
          description: 'create or update files in the sandbox',
          parameters: z.object({
            files: z.array(z.object({ path: z.string(), content: z.string() }))
          }),
          handler: async ({ files }, { step, network }: Tool.Options<codeAgentState>) => {
            await publish(
              await userChannel().projectInfo("Generating project Files...")
            )
            const newFiles = await step?.run("createOrUpdateFiles", async () => {
              try {
                const updatedFiles = network.state.data.files || {};
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  const fullPath = toProjectPath(file.path);
                  await sandbox.files.write(fullPath, file.content);
                  updatedFiles[file.path] = file.content;

                }
                return updatedFiles;
              } catch (e) {
                return "Error creating/updating files: " + e;

              }
            })
            if (typeof newFiles == "object") {
              network.state.data.files = newFiles;
              return `Successfully updated ${files.length} files.`;
            }



          }
        }),
        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string())
          }),
          handler: async ({ files }, { step }) => {
            await publish(
              await userChannel().projectInfo("Reading project Files...")
            )
            return await step?.run("readFiles", async () => {
              try {
                const contents: Record<string, string>[] = [];
                const sandbox = await getSandbox(sandboxId);
                for (const file of files) {
                  const fullPath = toProjectPath(file);
                  const content = await sandbox.files.read(fullPath);
                  contents.push({
                    path: file,
                    content: content
                  });
                }
                return JSON.stringify(contents)
              }
              catch (e) {
                return "Error reading files: " + e;
              }


            })


          }

        }),
        createTool({
          name: "unsplashImage",
          description:
            "Search Unsplash and download an image into /public/assets/unsplash. Return local public path and attributions.",
          parameters: z.object({
            query: z.string().min(2),
            orientation: z
              .enum(["landscape", "portrait", "squarish"])
              .default("landscape"),
            purpose: z
              .enum([
                "hero",
                "feature",
                "testimonial",
                "background",
                "listing",
                "generic",
              ])
              .default("generic"),
            filenameHint: z.string().default(""),
          }),
          handler: async ({ query, orientation, purpose, filenameHint }) => {
            await publish(
              await userChannel().projectInfo(
                "Downloading images...",
              ),
            );
            const accessKey = process.env.UNSPLASH_API_KEY;

            if (!accessKey) {
              throw new Error("Missing Unsplash API Key");
            }

            const sandbox = await getSandbox(sandboxId);

            const search = await searchUnsplashPhoto({
              accessKey,
              query,
              orientation,
            });

            const photo = search.results[0];
            if (!photo)
              throw new Error(`No Unsplash result for query: ${query}`);

            const imageUrl =
              (purpose === "background"
                ? photo.urls.full
                : photo.urls.regular) ?? photo.urls.regular;

            if (!imageUrl)
              throw new Error("Unsplash result missing usable image URL");

            const safeSlug = String(filenameHint ?? photo.id ?? query)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "")
              .slice(0, 60);

            const publicDir = "/home/user/project/public/assets/unsplash";
            const localFile = `${publicDir}/${safeSlug}.jpg`;
            const publicPath = `/assets/unsplash/${safeSlug}.jpg`;

            await sandbox.commands.run(`mkdir -p "${publicDir}"`);

            const cmd = `curl -L --fail --silent --show-error "${imageUrl}" -o "${localFile}"`;
            const result = await sandbox.commands.run(cmd);

            if (result.exitCode !== 0) {
              const msg = (result.stderr || result.stdout || "").slice(0, 800);
              throw new Error(`Failed to download Unsplash image: ${msg}`);
            }

            const photographerName = photo.user.name ?? null;
            const photographerUsername = photo.user.username ?? null;
            const photoUrl = photo.links.html ?? null;

            const attributionUrl =
              photoUrl !== null
                ? `${photoUrl}?utm_source=forgeai&utm_medium=referral`
                : null;

            const attribution: UnsplashAttribution = {
              photographerName,
              photographerUsername,
              photoUrl,
              attributionUrl,
            };

            return { publicPath, localFile, attribution };
          },
        }),

      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          // const lastMessage = result.output.findLastIndex(
          //   (message) => message.role === "assistant",
          // );

          // const message =
          //   (result.output[lastMessage] as TextMessage) || undefined;
          const output = Array.isArray(result.output) ? result.output : [];

          const message = [...output]
            .reverse()
            .find((m) => m?.role === "assistant") as TextMessage | undefined;

          const lastTextMessage = message?.content
            ? typeof message.content === "string"
              ? message.content
              : message.content.map((c) => c.text).join("")
            : undefined;

          if (lastTextMessage && network) {
            if (lastTextMessage.includes("<task_summary>")) {
              network.state.data.summary = lastTextMessage;
            }
          }

          return result;
        },
      },
    });
    const network = createNetwork<codeAgentState>({
      name: "codeing-agent-network",
      agents: [codeAgent],
      maxIter: 5,
      // defaultState: createState<codeAgentState>({
      //   summary: "",
      //   files: {},
      // }),
      defaultState: CodingAgentState,
      router: async ({ network }) => {
        const hasSummary = Boolean(network.state.data.summary);
        const hasFiles = Object.keys(network.state.data.files || {}).length > 0;
        // Only stop when BOTH summary AND files exist
        if (hasSummary && hasFiles) {
          return;
        }
        return codeAgent;

      },


    });
    const inputMessage = event.data?.message ?? event.data?.value;
    if (!inputMessage || typeof inputMessage !== "string") {
      await step.run("save-invalid-input-error", async () => {
        return await db.message.create({
          data: {
            content: "Missing input message for code generation.",
            role: "ASSISTANT",
            type: "ERROR",
            projectId: event.data.projectId,
            userId: event.data.userId,
          }
        })
      });

      return {
        sandboxurl: "",
        title: "Code Fragment",
        files: {},
        summary: "",
      };
    }

    let result = await network.run(inputMessage, { state: CodingAgentState })

    // If AI responded but wrote zero files, retry once with explicit instruction
    if (Object.keys(result.state.data.files || {}).length === 0) {
      result = await network.run(
        `${inputMessage}\n\nIMPORTANT: You MUST call createOrUpdateFiles with the complete file contents NOW before writing <task_summary>. Do not skip this step.`
      );
    }
    const builderInput = await step.run('build-agent-input', async () => {
      if (!event.data.imageUrl) return event.data.message;
      const spec = await extractDesignSpecFromImage({
        imageUrl: event.data.imageUrl,
        userHint: event.data.message,
      })
      return [
        `designSpec:\n` +
        `${JSON.stringify(spec, null, 2)}\n\n` +
        `User notes:\n` +
        `${event.data.message}`
      ].join("\n")

    })
    const result1 = await network.run(builderInput, { state: CodingAgentState })

    await step.run("ensure-dev-server", async () => {
      await publish(
        await userChannel().projectInfo("Ensure is Dev Server on or not...")
      )
      const sandbox = await getSandbox(sandboxId);

      // Check whether something is already listening on :3000
      const check = await sandbox.commands.run(
        `sh -lc 'if command -v ss >/dev/null 2>&1; then ss -ltn | grep -q ":3000"; else netstat -ltn 2>/dev/null | grep -q ":3000"; fi && echo RUNNING || echo STOPPED'`
      );

      if (!check.stdout.includes("RUNNING")) {
        // Start Next.js in background from project root
        await sandbox.commands.run(
          `sh -lc 'cd /home/user/project && nohup npx next --turbo -p 3000 > /tmp/next-dev.log 2>&1 &'`
        );
      }

      // Wait for server to be ready (up to ~30s)
      for (let i = 0; i < 15; i++) {
        const probe = await sandbox.commands.run(
          `sh -lc 'if command -v curl >/dev/null 2>&1; then curl -sSf http://127.0.0.1:3000 >/dev/null; else wget -qO- http://127.0.0.1:3000 >/dev/null; fi && echo READY || echo NOT_READY'`
        );

        if (probe.stdout.includes("READY")) {
          return "ready";
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const logs = await sandbox.commands.run(`sh -lc 'tail -n 120 /tmp/next-dev.log 2>/dev/null || echo "No next-dev.log found"'`);
      throw new Error(`Port 3000 did not become ready. Logs:\n${logs.stdout || logs.stderr}`);
    });

    const sandboxurl = await step.run("get sandbox url", async () => {
      await publish(
        await userChannel().projectInfo("Generating Sandbox url...")
      )
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000)
      return `https://${host}`;
    });
    await step.run("generate-metadata", async () => {
      await publish(
        await userChannel().projectInfo("Generating project name...")
      )
      const projectName = await runNamingAgent(`${TITLE_PROMPT} ${event.data.message}`);
      await db.project.update({
        where: { id: event.data.projectId },
        data: {
          name: projectName || `Project-${Date.now()}`,
        },
      })
    })

    await step.run("save-to db", async () => {
      await publish(
        await userChannel().projectInfo("Saving to database...")
      )
      const filesMap = result.state.data.files || {};
      const hasError = Object.keys(result.state.data.files || {}).length === 0;
      if (hasError) {
        return await db.message.create({
          data: {
            content: "Something went wrong. Try again later.",
            role: "ASSISTANT",
            type: "ERROR",
            projectId: event.data.projectId,
            userId: event.data.userId,
          }
        })
      }
      const combinedCode = Object.entries(filesMap)
        .map(([path, content]) => `// --- ${path} ---\n${content}`)
        .join("\n\n");
      return await db.message.create({
        data: {
          content: result.state.data.summary || "Code fragment created successfully.",
          role: "ASSISTANT",
          type: "RESULT",
          projectId: event.data.projectId,
          userId: event.data.userId,
          codeFragment: {
            create: {
              sandboxUrl: sandboxurl,   // <-- capital U to match schema
              sandboxId: sandboxId,
              title: "Code Fragment",
              files: filesMap,
              language: "typescript",
              code: combinedCode,
            }
          }
        }
      })
    })
    await publish(
      await userChannel().projectInfo("Project Demo is ready...")
    )
    return {
      sandboxurl,
      title: "Code Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  },
);

