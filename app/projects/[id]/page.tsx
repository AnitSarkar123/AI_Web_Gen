import { ProjectView } from "@/components/project-view";
import { getApiClient } from "@/lib/api-client";
import { headers } from "next/headers";

export default async function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const requestHeaders = await headers();

    const apiClient = getApiClient(requestHeaders);

    const result = await apiClient.messages.get({ query: { projectId: id } });
    
    // Safely extract messages array, handling both Response objects and direct arrays
    let messages = null;
    if (result && typeof result === 'object') {
        if (Array.isArray(result)) {
            messages = result;
        } else if ('data' in result && Array.isArray((result as Record<string, unknown>).data)) {
            messages = (result as Record<string, unknown>).data as typeof messages;
        }
    }

    return <ProjectView projectId={id} initialMessages={messages} />;
}