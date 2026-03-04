import { ProjectView } from "@/components/project-view";
import { apiClient } from "@/lib/api-client";

export default async function ProjectPage({params}:{params: Promise<{id:string}>}) {
    const {id}=await params;
    const {data} =await apiClient.messages.get({ query:{ projectId :id}})
    return (
        <ProjectView projectId={id} intialMessages={data}/>
    )
}