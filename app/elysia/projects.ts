import Elysia from "elysia";
import { create } from 'domain';
import { db } from "@/lib/db";
import { message } from './messages';
import { z } from "zod";
import { inngest } from "@/inngest/client";
export const projects = new Elysia({ prefix: '/projects' })
    .post('/', async ({ body }) => {
        const createProject = await db.project.create({
            data: {
                name: `Project-${Date.now()}`,
                messages: {
                    create: {
                        content: body.messages,
                        role: "USER",
                        type: "RESULT",

                    }
                }
            }
        })
        await inngest.send({
            name: "code-agent/codeAgent.run",
            data: {
                message: body.messages,
                projectId: createProject.id,
            }
        })
        return createProject;

    },
        {
            body: z.object({
                messages: z.string().min(1, 'Message is required').max(1000, 'Message is too long'),

            })
        }
    )