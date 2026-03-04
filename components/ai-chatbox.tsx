"use client"
import { Controller, useForm } from "react-hook-form"
import { FieldGroup } from "./ui/field"
import React from "react"
import Image from "next/image"
// import { zhCN } from "date-fns/locale"
import { set, z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { Textarea } from "./ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "./ui/dropdown-menu"
import { Plus as IconPlus, Paperclip as IconPaperclip, Loader2 as IconLoader2, ArrowUp as IconArrowUp, X as IconX } from "lucide-react"
import { Button } from "./ui/button"
import { fileURLToPath } from 'node:url';
import { useUploadThing } from "@/lib/uploadthing"
import { toast } from "sonner"
import { projects } from '../app/elysia/projects';

// TODO: Import or define apiClient - replace with your actual API client
import { apiClient } from '@/lib/api-client';
import { useRouter } from "next/navigation"

interface props {
    projectId?: string
}
const messageSchema = z.object({
    message: z.string().min(1, 'Message is required').max(1000, 'Message is too long')
})
export const AIChatBox = ({ projectId }: props) => {
    const router = useRouter();
    const form = useForm<z.infer<typeof messageSchema>>({
        resolver: zodResolver(messageSchema),
        defaultValues: {
            message: "",

        }
    })
    const [attachedFiles, setAttachedFiles] = React.useState<File | null>(null)
    const [imagePreview, setImagePreview] = React.useState("")
    const { startUpload, isUploading } = useUploadThing("designImageUploader")

    const fileRef = React.useRef<HTMLInputElement>(null)
    const onSubmit = async ({ message }: z.infer<typeof messageSchema>) => {
        const cleanMessage = message.trim() ?? "";
        try {
            //     if (!cleanMessage && attachedFiles) {
            //         toast.error("Please enter a message before submitting an attachment.")
            //         return;
            //     }
            //     const files = [attachedFiles as File]
            //     const res = await startUpload(files)
            //     console.log(res)
            //     const url = res?.[0]?.ufsUrl;
            //     console.log(url)
            //     if (projectId) {
            //         // TODO: Replace with actual API call to save message
            //         const res = await apiClient.projects.post()
            //         console.log("Message sent with attachment:", url, cleanMessage)
            //         if (res) {
            //             // router.push(`/projects/${res.data.id}`)
            //             return;
            //         }

            //     }
            //     await apiClient.messages.post();
            // await apiClient.messages.post({ message: cleanMessage });
            if (!projectId) {
                const res = await apiClient.projects.post({ messages: message })
                if (res.data?.id) {
                    router.push(`/projects/${res.data.id}`)
                    return;
                }


            }
            if (projectId) {
                await apiClient.messages.post({ message: cleanMessage, projectId });
            }

        }
        catch (error) {
            toast.error("Failed to send message. Please try again.");

        } finally {
            form.reset()
            setAttachedFiles(null)
            setImagePreview("")
            router.refresh()
        }

    }
    const handelSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] as File
        if (!file.type.startsWith("image/")) {
            toast.error("Only image files are allowed.")
        }
        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string)
        }
        reader.readAsDataURL(file)
        setImagePreview(reader.result as string)
        setAttachedFiles(file);
    }
    const removeFile = () => {
        setAttachedFiles(null)
        setImagePreview("")
    }
    const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            await form.handleSubmit(onSubmit)(e)
            form.reset() // Clear the textarea after submission
        }
    }
    return (
        <div className="mx-auto flex flex-col w-full gap-4">
            <div className="relative z-10 flex flex-col w-full mx-auto content-center">
                <form className="overflow-visible rounded-xl border p-2 bg-[#ffeac1] border-[#ffeac1] focus-within:border-[#ffeac1]"
                    id="message-form"
                    onSubmit={form.handleSubmit(onSubmit)}>
                    {imagePreview && attachedFiles && (
                        <div className="relative flex items-center w-fit gap-2 mb-2 overflow-hidden">
                            <div className="relative flex h-16 w-16 items-center justify-content">
                                <Image
                                    alt={attachedFiles.name}
                                    src={imagePreview}
                                    fill
                                    className="object-cover"
                                />



                            </div>
                            <button title="Remove attached file"
                                className="absolute z-10 rounded-full shadow-2xl right-0 top-0 bg-[#f7f4ee] p-1 cursor-pointer"
                                onClick={removeFile}>

                                <IconX size={16} />
                            </button>

                        </div>
                    )}
                    <FieldGroup>
                        <Controller name="message" control={form.control}
                            render={({ field, }) => (
                                <Textarea {...field}
                                    className="max-h-50 min-h-16 resize-none rounded-none bg-transparent!  p-0 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
                                    placeholder="Ask forge ai"
                                    onKeyDown={handleKeyDown}
                                />
                            )} />
                    </FieldGroup>


                    <div className="flex items-center gap-1">
                        <div className="flex items-end gap-0.5 sm:gap-1">
                            <input type="file" className="sr-only" multiple onChange={handelSelectFile} ref={fileRef} title="Upload files" />
                            <DropdownMenu>
                                <DropdownMenuTrigger
                                    className="-ml-0.5 h-7 w-7 rounded-md cursor-pointer"
                                    type="button"
                                >
                                    <IconPlus size={16} />

                                </DropdownMenuTrigger >
                                <DropdownMenuContent className="space-y-1">
                                    <DropdownMenuItem className="rounded-[calc(1rem-6px)] text-xs"
                                        onClick={() => fileRef.current!.click()}>
                                        <div>
                                            <IconPaperclip size={16} className="text-muted-foreground" />
                                            <span>Attach files</span>
                                        </div>


                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                            <Button
                                className="h-7 w-7 rounded-full shadow-lg cursor-pointer"
                                size="icon"
                                type="submit"
                                variant="default"
                                form="message-form"
                                disabled={form.formState.isSubmitting || isUploading}

                            >
                                {form.formState.isSubmitting || isUploading ? <IconLoader2 className="size-4 animate-spin" size={16} /> : <IconArrowUp size={16} />}
                            </Button>

                        </div>


                    </div>
                </form>

            </div>
        </div>
    )
}