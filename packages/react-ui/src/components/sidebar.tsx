import {
    Link2,
    Package2,
    Play,
    Settings,
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
    const isActive = location.pathname === to;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    to={to}
                    className={`ap-flex ap-h-9 ap-w-9 ap-items-center ap-justify-center ap-rounded-lg ap-text-muted-foreground ap-transition-colors hover:ap-text-foreground md:ap-h-8 md:ap-w-8 ${isActive ? 'ap-bg-accent' : ''} ${extraClasses || ''}`}
                >
                    <Icon className="ap-h-5 ap-w-5" />
                    <span className="ap-sr-only">{label}</span>
                </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
    );
};

export function Sidebar({ children }: { children: React.ReactNode }) {
    return (
        <div className="ap-flex ap-min-h-screen ap-w-full ap-bg-muted/40">
            <aside className="ap-w-14 ap-flex ap-flex-col ap-border-r ap-bg-background">
                <nav className="ap-flex ap-flex-col ap-items-center ap-gap-4 ap-px-2 sm:ap-py-5">

                    <div className="ap-h-[48px] ap-p-2 ap-items-center ap-justify-center">
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
                    <CustomTooltipLink
                        to="/settings"
                        label="Settings"
                        icon={Settings}
                    />
                </nav>
            </aside>
            <div className="ap-flex-1 ap-p-4">
                <div className="ap-flex ap-flex-col ap-gap-2">
                    <div className="ap-flex">
                        <h1 className="ap-text-2xl ap-font-bold">Project Switcher</h1>
                        <div className="ap-ml-auto">
                            <UserSettingsDropdown />
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
