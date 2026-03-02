import Sandbox from "e2b";
import { inngest } from "./client";
import { createAgent,gemini } from "@inngest/agent-kit";
import { getSandbox } from "@/lib/sandbox";
export const codeAgent = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/codeAgent.run" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-or-Create Sandbox", async () => {
      
      const {sandboxId} =await Sandbox.create("forgeai-v1");
      return sandboxId;
    });
   const summerizerAgent = createAgent({
  name: 'Summerizer Agent',
  description: 'You are a summerizer agent that summarizes content.',
  system:
    'You are an expert at summarizing content. You take in content and produce a concise summary that captures the main points and key information.',
  model: gemini({
    model: 'gemma-3-1b-it',
    apiKey: process.env.GEMINI_API_KEY,
  }),
});
 const output =await summerizerAgent.run(
     `Summerize the following content: ${event.data.messages}`
 )
 const sandboxurl= await step.run("get sandbox url", async () => {
  const sandbox= await getSandbox(sandboxId);
  const host = sandbox.getHost(3000)
  return `https://${host}`;
});
 return {output,sandboxurl};
},
);