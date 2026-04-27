import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import Elysia from "elysia";
import { z } from "zod";
import { clerkPlugin } from "elysia-clerk";
// import { requirePro } from "";
import { requirePro } from "@/lib/pro-features";
export const message = new Elysia({ prefix: '/messages' }).use(clerkPlugin())
    .get('/', async ({ auth, status, query }) => {
        try {
            const { userId } = auth();

            if (!userId) {
                console.error("[messages GET] No userId from auth");
                return status(401, { error: "Unauthorized" });
            }

            console.log("[messages GET] Fetching messages for project:", query.projectId);

            const messages = await db.message.findMany({
                where: {
                    projectId: query.projectId
                },
                orderBy: { createdAt: "asc" },
                include: {
                    codeFragment: true
                }
            });

            console.log("[messages GET] Found", messages.length, "messages");
            return messages;
        } catch (error) {
            console.error("[messages GET] Error fetching messages:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return status(500, { error: `Failed to fetch messages: ${errorMessage}` });
        }
    },
        {
            query: z.object({
                projectId: z.string().min(3, 'Project ID is required')
            })
        }
    )
    .post('/', async ({ auth, body, status }) => {
        try {
            const { userId } = auth();

            if (!userId) {
                console.error("[messages POST] No userId from auth");
                return status(401, { error: "Unauthorized" });
            }

            if (body.imageUrl) {
                try {
                    await requirePro(auth, status, "screenshort_upload");
                } catch (proError) {
                    console.error("[messages POST] Pro feature check failed:", proError);
                    return status(403, { error: "Pro feature required" });
                }
            }

            console.log("[messages POST] Creating message for project:", body.projectId.substring(0, 20));

            const createdMessage = await db.message.create({
                data: {
                    content: body.message,
                    projectId: body.projectId,
                    role: "USER",
                    type: "RESULT",
                    imageUrl: body.imageUrl,
                    userId
                }
            });

            console.log("[messages POST] Message created:", createdMessage.id);

            try {
                await inngest.send({
                    name: "code-agent/codeAgent.run",
                    data: { 
                        projectId: body.projectId,
                        message: createdMessage.content,
                        imageUrl: body.imageUrl,
                        userId
                    },
                });
                console.log("[messages POST] Inngest event sent successfully");
            } catch (inngestError) {
                console.error("[messages POST] Inngest send failed:", inngestError);
                // Don't return error here - message was already created
            }

            return createdMessage;
        } catch (error) {
            console.error("[messages POST] Unhandled error:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            return status(500, { error: `Failed to create message: ${errorMessage}` });
        }
    },
    {
        body: z.object({
            message: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),
            projectId: z.string().min(3, 'Project ID is required'),
            imageUrl: z.string().optional(),
        })
    }
);