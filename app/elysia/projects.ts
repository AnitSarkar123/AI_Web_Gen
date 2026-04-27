import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import Elysia from "elysia";
import { z } from "zod";
import { clerkPlugin } from "elysia-clerk";
// import { requirePro } from "";
import { requirePro } from "@/lib/pro-features";

export const projects = new Elysia({ prefix: "/projects" })
    .use(clerkPlugin())
    .post(
        "/",
        async ({ auth, body, status }) => {
            try {
                const { userId } = auth();

                if (!userId) {
                    console.error("[projects POST] No userId from auth");
                    return status(401, { error: "Unauthorized" });
                }

                if (body.imageUrl) {
                    try {
                        await requirePro(auth, status, "screenshort_upload");
                    } catch (proError) {
                        console.error("[projects POST] Pro feature check failed:", proError);
                        return status(403, { error: "Pro feature required" });
                    }
                }

                console.log("[projects POST] Creating project with message:", body.message.substring(0, 50));

                const createdProject = await db.project.create({
                    data: {
                        name: `Project-${Date.now()}`,
                        userId: userId as string,
                        message: {
                            create: {
                                content: body.message,
                                role: "USER",
                                type: "RESULT",
                                imageUrl: body.imageUrl,
                                userId: userId as string,
                            },
                        },
                    },
                });

                console.log("[projects POST] Project created:", createdProject.id);

                try {
                    const inngestResult = await inngest.send({
                        name: "code-agent/codeAgent.run",
                        data: {
                            message: body.message,
                            projectId: createdProject.id,
                            imageUrl: body.imageUrl,
                            userId,
                        },
                    });
                    console.log("[projects POST] Inngest event sent successfully:", inngestResult);
                } catch (inngestError) {
                    console.error("[projects POST] Inngest send failed:", inngestError);
                    // Don't return error here - project was already created
                }

                console.log("[projects POST] Returning project:", JSON.stringify(createdProject));
                return createdProject;
            } catch (error) {
                console.error("[projects POST] Unhandled error:", error);
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                return status(500, { error: `Failed to create project: ${errorMessage}` });
            }
    },
        {
            body: z.object({
                message: z
                    .string()
                    .min(3, "Message is required")
                    .max(1000, "Message is too long"),
                imageUrl: z.string().optional(),
            }),
        },
    )
    .get("/", async ({ auth, status }) => {
        const { userId } = auth();

        if (!userId) return status(401, { error: "Unauthorized" });

        const userProjects = await db.project.findMany({
            where: { userId },
            orderBy: { updatedAt: "desc" },
        });

        return userProjects;
    });