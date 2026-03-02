import Sandbox from "@e2b/code-interpreter";
import path from "path";
export const PROJECTROOT = "/home/user/project"; // this is the root directory of the sandbox, all file operations should be relative to this path
export async function getSandbox(sanboxId: string) {
    return await Sandbox.connect(sanboxId);
    

}

export const toProjectPath = (p: string) => {
    const normalized = p.replace(/\\/g, '/').trim();
    if (normalized.startsWith('/')) return normalized;
    return path.posix.join(PROJECTROOT, normalized);
}