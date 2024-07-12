import {
    Link2,
    Package2,
    Play,
    Settings,
    Users,
    Zap,
} from "lucide-react"


import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link, useLocation } from "react-router-dom"
import { theme } from "@/lib/theme"
import { UserSettingsDropdown } from "./user-settings-dropdown"
import { ModeToggle } from "../mode-toggle"

type Link = {
    icon: React.ReactNode
    label: string
    to: string,
}

const CustomTooltipLink = ({ to, label, icon: Icon, extraClasses }: {
    to: string,
    label: string,
    icon: React.ElementType,
    extraClasses?: string
}) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    to={to}
                    className={`flex p-1 flex-col gap-4 items-center justify-center rounded-lg  transition-colors hover:text-primary md:h-8 md:w-8 ${isActive ? 'bg-accent text-primary' : ''} ${extraClasses || ''}`}
                >
                    <Icon className="h-6 w-6" />
                    <span className="sr-only">{label}</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};

export function Sidebar({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <aside className="w-18 flex flex-col border-r bg-background">
                <nav className="flex flex-col gap-5 items-center  px-2 sm:py-5">

                    <div className="h-[48px] p-2 items-center justify-center">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <img src={theme.logoIconUrl} alt="logo" />
                            </TooltipTrigger>
                            <TooltipContent side="right">{theme.websiteName}</TooltipContent>
                        </Tooltip>
                    </div>
                    <CustomTooltipLink
                        to="/flows"
                        label="Flows"
                        icon={Zap}
                    />
                    <CustomTooltipLink
                        to="/connections"
                        label="Link"
                        icon={Link2}
                    />
                    <CustomTooltipLink
                        to="/runs"
                        label="Runs"
                        icon={Play}
                    />
                    <CustomTooltipLink to="/team" label="Team" icon={Users} />
                    <CustomTooltipLink
                        to="/settings"
                        label="Settings"
                        icon={Settings}
                    />
                </nav>
            </aside>
            <div className="flex-1 p-4">
                <div className="flex flex-col g2">
                    <div className="flex">
                        <h1 className="text-2xl font-bold">Project Switcher</h1>
                        <div className="ml-auto">
                            <UserSettingsDropdown />
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
