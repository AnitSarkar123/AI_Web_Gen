import { MessagesContainer } from "@/components/messages-container";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getApiClient } from "@/lib/api-client";
import { headers } from "next/headers";
import Link from "next/link";
// import { projects } from '../elysia/projects';
import { projects } from "../elysia/projects";


export default async function ProjectsPage() {
  const requestHeaders = await headers();

  const apiClient = getApiClient(requestHeaders);

  const result = await apiClient.projects.get();
  
  // Safely extract projects array from response
  let projects: Array<{ id: string; name: string; sandboxId: string | null; imageUrl: string | null; userId: string; createdAt: Date; updatedAt: Date }> = [];
  if (result && typeof result === 'object') {
    if (Array.isArray(result)) {
      projects = result;
    } else if ('data' in result && Array.isArray((result as Record<string, unknown>).data)) {
      projects = (result as Record<string, unknown>).data as typeof projects;
    }
  }
  

  return (
    <ResizablePanelGroup
      className="h-dvh w-dvw overflow-hidden"
      direction="horizontal"
      id="project-view-layout"
    >
      <ResizablePanel defaultSize={20} minSize={20}>
        <MessagesContainer projectId="dummy id" />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={80} minSize={50}>
        
        <div className="flex flex-wrap items-center gap-6 p-6">
          {projects?.map((proj) => (
            <Link href={`/projects/${proj.id}`} key={proj.id}>
              <Button className="flex items-center justify-center p-6 h-20 text-white cursor-pointer">
                {proj.name}
              </Button>
            </Link>
          ))}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}