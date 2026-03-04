import React from 'react'
import { CodeFragment, Message } from '@/lib/generated/prisma/client';
// import { CodeFragment } from '@/lib/generated/prisma/client';
import { set } from 'zod';
import { create } from 'domain';
import { MessageCard } from './message-card';
interface props{
    projectId: string;
    intialMessages: (Message &{codeFragment:CodeFragment | null })[] | null;
    activeCodeFragment: CodeFragment | null;
    setActiveCodeFragment: (activeCodeFragment: CodeFragment | null) => void;
}
export default function MessagesContainer({
    projectId,
    intialMessages,
    activeCodeFragment,
    setActiveCodeFragment
}: props) {
  return (
    <div className='flex flex-1 flex-col justify-between overflow-hidden min-h-0 h-full' >
        <div className='flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-forground/20-scrollbar-track-transparent'>
        <div className='pt-2 pr-1 w-full'>
            {intialMessages?.map((message,index)=>(
                <MessageCard
                key={message.id}
                content={message.content}
                createdAt={message.createdAt}
                role={message.role}
                type={message.type}
                codeFragment={message.codeFragment}
                isActiveCodeFragment={activeCodeFragment?.id === message.codeFragment?.id}
                onCodeFragmentClick={()=> setActiveCodeFragment(message.codeFragment)}
                />

            ))}
                
                

        </div>

        </div>
      
    </div>
  )
}
