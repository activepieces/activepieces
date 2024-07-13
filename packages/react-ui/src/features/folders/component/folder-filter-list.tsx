import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/seperator"
import { TextWithIcon } from "@/components/ui/text-with-icon"
import { Folder, PlusIcon } from "lucide-react"


const FolderFilterList = () => {
    return (
        <div className="px-3 py-2">
            <h2 className="mb-2 text-lg font-semibold tracking-tight flex  justify-center items-center">
                <span className="flex">
                    Folders
                </span>
                <div className="flex-grow">
                </div>
                <div className="flex justify-center items-center">
                    <Button variant="ghost" >
                        <PlusIcon size={18} />
                    </Button>
                </div>
            </h2>
            <div className="flex flex-col space-y-1 w-[200px]">
                <Button variant="secondary" className="w-full justify-start flex">
                    <TextWithIcon icon={<Folder size={18} />} text="All flows" />
                    <div className="flex-grow"></div>
                    <span className="text-muted-foreground">19</span>
                </Button>
                <Separator className="my-6" />
                <Button variant="ghost" className="w-full justify-start">
                    HR Flows
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                    Radio
                </Button>
            </div>
        </div>
    )
}

export { FolderFilterList }