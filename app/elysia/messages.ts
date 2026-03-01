import { inngest } from "@/inngest/client";
import Elysia from "elysia";
import { z } from "zod";

export const messages = new Elysia({ prefix: '/messages' })
    .get('/', async () => {
        return { message: "Messages API is running" };
    })
    .post('/', async ({ body }) => {
        try {
            const result = await inngest.send({
                name: "code-agent/codeAgent.run",
                data: { 
                    messages: body.message,
                },
            });

            return { 
                success: true, 
                eventId: result.ids[0],
                message: "Event sent to Inngest successfully"
            };
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
            message: z.string().min(1, 'Message is required').max(1000, 'Message is too long')
        })
    }
);