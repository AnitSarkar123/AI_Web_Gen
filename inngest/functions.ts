import { inngest } from "./client";
import { createAgent,gemini } from "@inngest/agent-kit";
export const codeAgent = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/codeAgent.run" },
  async ({ event, step }) => {
   const summerizerAgent = createAgent({
  name: 'Summerizer Agent',
  description: 'You are a summerizer agent that summarizes content.',
  system:
    'You are an expert at summarizing content. You take in content and produce a concise summary that captures the main points and key information.',
  model: gemini({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
  }),
});
 const output =await summerizerAgent.run(
     `Summerize the following content: ${event.data.messages}`
 )
 return {output};
},
);