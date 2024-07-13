import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronDown, History, Home, Logs } from "lucide-react"
import { Link } from "react-router-dom"


export const BuilderNavBar = () => {
    return (
        <div className="flex items-left w-full border-b h-[70px] px-4 py-4">
            <div className="flex gap-2  justify-center items-center h-full">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link to='/flows'>
                            <Button variant="ghost" className="p-0">
                                <Home />
                            </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        Home
                    </TooltipContent>
                </Tooltip>
                <span>
                    Flow Untitled
                </span>
                <ChevronDown size={16}></ChevronDown>
            </div>
            <div className="flex-grow">

            </div>
            <div className="flex justify-center items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost">
                            <History />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        History
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost">
                            <Logs />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        Run Logs
                    </TooltipContent>
                </Tooltip>

                <Button>
                    Publish
                </Button>
            </div>
        </div>
    )
}