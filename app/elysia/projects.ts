import Elysia from "elysia";
import { db } from "@/lib/db";
import { z } from "zod";
import { inngest } from "@/inngest/client";
export const projects = new Elysia({ prefix: '/projects' })
    .post('/', async ({ body, set }) => {
        try {
            const createProject = await db.project.create({
                data: {
                    name: `Project-${Date.now()}`,
                    message: {
                        create: {
                            content: body.messages,
                            role: "USER",
                            type: "RESULT",

                        }
                    }
                }
            })

            try {
                await inngest.send({
                    name: "code-agent/codeAgent.run",
                    data: {
                        message: body.messages,
                        projectId: createProject.id,
                    }
                })
            } catch (queueError) {
                console.error("Failed to enqueue code generation:", queueError)
            }

            return createProject;
        } catch (error) {
            console.error("Failed to create project:", error)
            set.status = 500;
            return {
                success: false,
                error: "Failed to create project",
            }
        }

    },
        {
            body: z.object({
                messages: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),

            })
        }
    )