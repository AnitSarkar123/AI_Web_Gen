import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import Elysia from "elysia";
import { z } from "zod";

export const message = new Elysia({ prefix: '/messages' })
    .get('/', async ({ query }) => {
        const message = await db.message.findMany({
            where: {
                projectId: query.projectId
            },
            orderBy: { updatedAt: "desc" },
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
    .post('/', async ({ body }) => {
        try {
            const createdMessage = await db.message.create({
                data: {
                    content: body.message,
                    projectId: body.projectId,
                    role: "USER",
                    type: "RESULT"
                }
            })
            const result = await inngest.send({
                name: "code-agent/codeAgent.run",
                data: { 
                    projectId: body.projectId,
                    value: createdMessage.content,
                    // messages: body.message,
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
            projectId: z.string().min(3, 'Project ID is required')
        })
    }
);