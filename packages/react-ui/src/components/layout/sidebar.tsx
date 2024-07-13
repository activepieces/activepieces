import {
    Bug,
    Link2,
    Logs,
    Plus,
    Settings,
    Zap,
    Shield,
} from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { Link, useLocation } from "react-router-dom"
import { theme } from "@/lib/theme"
import { UserSettingsDropdown } from "./user-settings-dropdown"
import { ProjectSwitcher } from "@/features/projects/components/project-switcher"
import { Button } from "../ui/button"

type Link = {
    icon: React.ReactNode
    label: string
    to: string,
    notifcation?: boolean
}

const CustomTooltipLink = ({ to, label, Icon, extraClasses, notifcation }: {
    to: string,
    label: string,
    Icon: React.ElementType,
    extraClasses?: string,
    notifcation?: boolean
}) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Link
                    to={to}
                    className={`flex relative p-1 flex-col gap-4 items-center justify-center rounded-lg  transition-colors hover:text-primary md:h-8 md:w-8 ${isActive ? 'bg-accent text-primary' : ''} ${extraClasses || ''}`}
                >
                    <Icon className="h-6 w-6" />
                    <span className="sr-only">{label}</span>
                    {notifcation && <span className="absolute top-[-3px] right-[-3px] h-2 w-2 bg-destructive rounded-full"></span>}

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
                        Icon={Zap}
                    />
                    <CustomTooltipLink
                        to="/runs"
                        label="Runs"
                        Icon={Logs}
                    />
                    <CustomTooltipLink to="/issues" label="Issues" Icon={Bug} notifcation={true} />
                    <CustomTooltipLink
                        to="/connections"
                        label="Link"
                        Icon={Link2}
                    />

                    <CustomTooltipLink
                        to="/settings"
                        label="Settings"
                        Icon={Settings}
                    />
                </nav>
            </aside>
            <div className="flex-1 p-4">
                <div className="flex flex-col g2">
                    <div className="flex ">
                        <ProjectSwitcher />
                        <div className="flex-grow"></div>
                        <div className="flex gap-4 justify-center items-center">
                            <Button variant={"outline"} size="sm" className="flex items-center gap-2 justify-center">
                                <Plus className="h-4 w-4" />
                                <span>Invite User</span>
                            </Button>
                            <Button variant={"outline"} size="sm" className="flex items-center gap-2 justify-center">
                                <Shield className="h-4 w-4" />
                                <span>Platform Admin</span>
                            </Button>
                            <UserSettingsDropdown />
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    )
}
