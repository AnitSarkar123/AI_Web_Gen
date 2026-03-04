"use client"
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
// import { Direction } from 'radix-ui';
import { CodeFragment,Message } from "@/lib/generated/prisma/client";
import { IconWorld, IconCode } from "@tabler/icons-react";
// import { Tabs } from "@base-ui/react";
import { Table } from "./ui/table";
import { Tabs,TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import MessagesContainer from "./messages-container";
// import { cacheLife } from '../.next/dev/types/cache-life';
// import { TabsList } from "@base-ui/react";
interface props {
    projectId: string;
    intialMessages: (Message &{codeFragment:CodeFragment | null })[] | null;
}
export function ProjectView({ projectId, intialMessages }: props) {
    const [activeCodeFragment, setActiveCodeFragment] = useState<CodeFragment | null>(null);
    const [tabState,setTabstate]=useState<"preview" | "code">("preview")

    return (
        <ResizablePanelGroup className="h-dvh w-dvh overflow-hidden" direction="horizontal">
           < ResizablePanel defaultSize={20} minSize={20} className="border-r">
            <MessagesContainer
            projectId={projectId}
            intialMessages={intialMessages}
            activeCodeFragment={activeCodeFragment}
            setActiveCodeFragment={setActiveCodeFragment}

            />

           </ResizablePanel>
           <ResizableHandle withHandle/>

            <ResizablePanel defaultSize={80} minSize={50}>
                <Tabs className="h-full"
                 defaultValue="preview"
                 value={tabState}
                 onValueChange={(value)=>setTabstate(value as "preview" | "code")}
                 >
                    <div className="w-full flex items-center p-2 border-b gap-x-2">
                        <TabsList className="h-8 p-0 border min-w-48">
                            <TabsTrigger value="preview">
                                <IconWorld/>
                                
                            </TabsTrigger>
                            <TabsTrigger value="code">
                                <IconCode/>
                                
                            </TabsTrigger>

                        </TabsList>

                    </div>
                    <TabsContent value="preview" >
                        Project Preview

                    </TabsContent>
                    <TabsContent value="code" >
                        Project code

                    </TabsContent>


                </Tabs>
            </ResizablePanel>


        </ResizablePanelGroup>
    )
}