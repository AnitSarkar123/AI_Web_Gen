import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import Elysia from "elysia";
import { z } from "zod";
import { clerkPlugin } from "elysia-clerk";
// import { requirePro } from "";
import { requirePro } from "@/lib/pro-features";
export const message = new Elysia({ prefix: '/messages' }).use(clerkPlugin())
    .get('/', async ({ auth, status, query }) => {
        const { userId } = auth();

        if (!userId) return status(401, { error: "Unauthorized" });
        const message = await db.message.findMany({
            where: {
                projectId: query.projectId
            },
            // return messages in chronological order (oldest first)
            orderBy: { createdAt: "asc" },
            include: {
                codeFragment: true
            }
        })
        return message;
    },
        {
            query: z.object({
                projectId: z.string().min(3, 'Project ID is required')
            })
        }
    )
    .post('/', async ({ auth, body, status }) => {
        const { userId } = auth();

        if (!userId) return status(401, { error: "Unauthorized" });
        if (body.imageUrl) {
            await requirePro(auth, status, "screenshort_upload");
        }


        try {
            const createdMessage = await db.message.create({
                data: {
                    content: body.message,
                    projectId: body.projectId,
                    role: "USER",
                    type: "RESULT",
                    imageUrl: body.imageUrl,
                    userId
                }
            })
            await inngest.send({
                name: "code-agent/codeAgent.run",
                data: { 
                    projectId: body.projectId,
                    message: createdMessage.content,
                    imageUrl: body.imageUrl,
                    userId

                },
            });

            return createdMessage;
        } catch (error) {
            console.error("Inngest send error:", error);
            return { 
                success: false, 
                error: "Failed to send event" 
            };
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