import Sandbox from "@e2b/code-interpreter";
export async function getSandbox(sanboxId: string) {
    return await Sandbox.connect(sanboxId);
    
}