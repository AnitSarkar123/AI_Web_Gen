import Sandbox from "@e2b/code-interpreter";
import path from "path";
export const PROJECTROOT = "/home/user/project"; // this is the root directory of the sandbox, all file operations should be relative to this path
export async function getSandbox(sanboxId: string) {
    return await Sandbox.connect(sanboxId, {

        timeoutMs: 10 * 60 * 1000,

    });
    

}

export const toProjectPath = (p: string | undefined) => {
    if (!p) {
        throw new Error("Path cannot be empty or undefined");
    }
    
    const normalized = p.replace(/\\/g, '/').trim();

    // Strip any absolute prefix pointing to known sandbox roots
    // so ALL writes are forced into PROJECTROOT regardless of what the AI sends
    const stripped = normalized
        .replace(/^\/home\/user\/project\/?/, '')
        .replace(/^\/home\/user\/?/, '')
        .replace(/^\/+/, '');

    return path.posix.join(PROJECTROOT, stripped);
}