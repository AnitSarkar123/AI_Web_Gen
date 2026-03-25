import { inngest } from "@/inngest/client";
import { db } from "@/lib/db";
import { getSandbox, toProjectPath } from "@/lib/sandbox";
import Elysia from "elysia";
import { z } from "zod";
import { clerkPlugin } from "elysia-clerk";
// import { requirePro } from "";
import { requirePro } from "@/lib/pro-features";
export const fragments = new Elysia({ prefix: '/fragments' }).use(clerkPlugin())
    .patch("/:fragmentId", async ({ params, body, auth, status }) => {
        const { userId } = auth();
        if (!userId) return status(401, { error: "Unauthorized" });
        await requirePro(auth, status, "inline_code_edits");
        const existingFragment = await db.codeFragment.findUnique({
            where:{id: params.fragmentId},
            select:{files:true,sandboxId:true},

        })
        if(!existingFragment) throw new Error("fragment not found");
        const sandboxId = existingFragment.sandboxId ?? body.sandboxId;
        if(!sandboxId) throw new Error("Sandbox ID is required");
        const sandbox = await getSandbox(sandboxId);
        const entries = Object.entries(body.files);
        for(const [path, content] of entries){
            // await sandbox.writeFile(fileName, content);
            const fullpath =toProjectPath(path);
            await sandbox.files.write(fullpath, content);
        }
        const updateFiles={
            ...(existingFragment.files as Record<string,string>),
            ...body.files,
        }
        const updateFragment = await db.codeFragment.update({
            where:{id: params.fragmentId},
            data:{
                files :updateFiles,
            }
        })
        return updateFragment;
       

    },{
        body: z.object({
            files:z.record(z.string(),z.string(),"Files is required"),
            projectId: z.string().min(3, 'Project ID is required'),
            sandboxId: z.string().min(3, 'Sandbox ID is required'),
        }),
        params: z.object({
            fragmentId: z.string().min(3, 'Fragment ID is required')
        })
    })