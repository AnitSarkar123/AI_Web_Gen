import Sandbox from "e2b";
import { inngest } from "./client";
import { createAgent, createTool, gemini, TextMessage, createNetwork, Tool, createState } from "@inngest/agent-kit";
import { getSandbox, toProjectPath } from "@/lib/sandbox";
import { create } from "domain";
import z from "zod";
import { PROMPT } from "./prompt";
import { messages } from '../app/elysia/messages';
import { Message } from '../lib/generated/prisma/models/Message';
import { ContextMenu as ContextMenuPrimitive } from 'radix-ui';
import { Code } from "lucide-react";
interface codeAgentState {
  summary?: string;
  files?: Record<string, string>;
}
export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/codeAgent.run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-or-Create Sandbox", async () => {

      const { sandboxId } = await Sandbox.create("forgeai-v1");
      return sandboxId;
    });

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
          name: 'createOrUpdateFiles',
          description: 'create or update files in the sandbox',
          parameters: z.object({
            files: z.array(z.object({ path: z.string(), content: z.string() }))
          }),
          handler: async ({ files }, { step, network }: Tool.Options<codeAgentState>) => {
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
            if (newFiles && typeof newFiles == "object" && !Array.isArray(newFiles)) {
              network.state.data.files = newFiles;
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

        })

      ],
      lifecycle: {
        onResponse: async ({ result, network }) => {
          const lastMessage = result.output.findLastIndex(
            (message) => message.role === "assistant"
          );
          const message = (result.output[lastMessage] as TextMessage) || undefined;
          const lastTextMessage = message.content ? typeof message.content === "string"
            ? message.content : message.content.map((c) => c.text).join("")
            : undefined
          if (lastTextMessage && network) {
            if (lastTextMessage.includes('<task_summary>')) {
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
      maxIter: 20,
      defaultState: createState<codeAgentState>({
        summary: "",
        files: {},
      }),
      router: async ({ network }) => {
        if (network.state.data.summary) {
          return;
        }
        return codeAgent;

      },


    });
    const result = await network.run(event.data.message);

    const sandboxurl = await step.run("get sandbox url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000)
      return `https://${host}`;
    });
    return {
      sandboxurl,
      title: "Code Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary
    };
  },
);

