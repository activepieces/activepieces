"use client"

import { Home, Settings, Users, BarChart3, FileText, HelpCircle, Inbox, Workflow, Table, Mailbox, MoreHorizontal, ChevronRight, Bot, Plug, Play, Zap, Link2 } from "lucide-react"
import { useState } from "react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar-shadcn"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ApDashboardSidebarHeader } from "./ap-sidebar-header"
import { SidebarUser } from "./sidebar-user"
import UsageLimitsButton from "./usage-limits-button"
import { flagsHooks } from "@/hooks/flags-hooks"
import { ApFlagId, Permission } from "@activepieces/shared"
import { HelpAndFeedback } from "../help-and-feedback"
import { SidebarInviteUserButton } from "./sidebar-invite-user"
import { cn } from "@/lib/utils"
import { authenticationSession } from "@/lib/authentication-session"
import { t } from "i18next"
import { useAuthorization } from "@/hooks/authorization-hooks"
import { platformHooks } from "@/hooks/platform-hooks"
import { useEmbedding } from "@/components/embed-provider"
import { useNavigate } from "react-router-dom"
import { SidebarPlatformAdminButton } from "./sidebar-platform-admin-button"
import { McpSvg } from "@/assets/img/custom/mcp"

export function DashboardSidebar() {
    const { data: showProjectUsage } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_PROJECT_USAGE);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
    const { platform } = platformHooks.useCurrentPlatform();
    const { embedState } = useEmbedding();
    const { checkAccess } = useAuthorization();
    const navigate = useNavigate();

    const items = [
        {
            to: authenticationSession.appendProjectRoutePrefix('/todos'),
            label: t('Inbox'),
            show:
                (platform.plan.todosEnabled || !embedState.isEmbedded) &&
                checkAccess(Permission.READ_TODOS),
            icon: Mailbox
        },
        {
            to: authenticationSession.appendProjectRoutePrefix('/flows'),
            label: t('Flows'),
            show: checkAccess(Permission.READ_FLOW),
            icon: Workflow
        },
        {
            to: authenticationSession.appendProjectRoutePrefix('/tables'),
            label: t('Tables'),
            show: checkAccess(Permission.READ_TABLE),
            icon: Table
        }
    ]


    const moreItems = [
        {
            type: 'link',
            to: authenticationSession.appendProjectRoutePrefix('/agents'),
            label: t('Agents'),
            icon: Bot,
            show: platform.plan.agentsEnabled || !embedState.isEmbedded,
            tutorialTab: 'agents',
        },
        {
            type: 'link',
            to: authenticationSession.appendProjectRoutePrefix('/connections'),
            label: t('Connections'),
            icon: Link2,
            show: checkAccess(Permission.READ_APP_CONNECTION),
        },
        {
            type: 'link',
            to: authenticationSession.appendProjectRoutePrefix('/mcps'),
            label: t('MCP'),
            show:
                (platform.plan.mcpsEnabled || !embedState.isEmbedded) &&
                checkAccess(Permission.READ_MCP),
            icon: McpSvg,
            tutorialTab: 'mcpServers',
        },
        {
            type: 'link',
            to: authenticationSession.appendProjectRoutePrefix('/runs'),
            label: t('Runs'),
            icon: Play,
            show: checkAccess(Permission.READ_APP_CONNECTION),
            isActive: (pathname: string) => pathname.includes('/runs') || pathname.includes('/issues'),
        }
    ]

    return (
        <Sidebar className="h-screen w-[250px]" collapsible="none">
            <SidebarHeader>
                <ApDashboardSidebarHeader isHomeDashboard={true} />

                <SidebarMenu>
                    {items.filter((item) => item.show).map((item) => {
                        const isActive = location.pathname.includes(item.to);
                        return (
                            <SidebarMenuItem key={item.to}>
                                <SidebarMenuButton onClick={() => {
                                    navigate(item.to);
                                }} isActive={isActive}>
                                    <item.icon className={cn('', {
                                        "text-primary": isActive,
                                    })} />
                                    <span>{item.label}</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}

                    <SidebarMenuItem>
                        <DropdownMenu open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
                            <DropdownMenuTrigger asChild>
                                <div>
                                    <SidebarMenuButton asChild>
                                        <div className="flex items-center gap-2 w-full text-sidebar-accent-foreground">
                                            <MoreHorizontal className="size-5" />
                                            <span className="grow">More</span>
                                        </div>
                                    </SidebarMenuButton>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="right" className="w-[220px]">
                                {moreItems.filter((item) => item.show).map((item) => {
                                    const isActive = location.pathname.includes(item.to);

                                    return (
                                        <DropdownMenuItem key={item.to} onClick={() => {
                                            navigate(item.to);
                                        }}>
                                            <div className="flex items-center gap-2">
                                                <item.icon className={cn('size-4', {
                                                    "text-primary": isActive,
                                                })} />
                                                <span>{item.label}</span>
                                            </div>
                                        </DropdownMenuItem>
                                    )
                                })}

                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
            </SidebarContent>
            <SidebarFooter >
                <SidebarPlatformAdminButton />
                <SidebarInviteUserButton />
                <HelpAndFeedback />
                {showProjectUsage && <UsageLimitsButton />}
                <SidebarUser />
            </SidebarFooter>
        </Sidebar>
    )
}
