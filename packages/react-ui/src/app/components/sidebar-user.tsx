import { LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar-shadcn";
import { userHooks } from "@/hooks/user-hooks";
import { useEmbedding } from "@/components/embed-provider";
import { authenticationSession } from "@/lib/authentication-session";
import { useQueryClient } from "@tanstack/react-query";
import { useTelemetry } from "@/components/telemetry-provider";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { t } from "i18next";

export function SidebarUser() {
  const { embedState } = useEmbedding();
  const { data: user } = userHooks.useCurrentUser();
  const queryClient = useQueryClient();
  const { reset } = useTelemetry();
  if (!user || embedState.isEmbedded) {
    return null;
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center justify-between w-full">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarFallback className="rounded-lg">{user.firstName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight ml-2">
            <span className="truncate font-semibold">{user.firstName}</span>
            <span className="truncate text-xs">{user.email}</span>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="flex items-center ml-2"
              variant="ghost"
              size="icon"
              onClick={() => {
                userHooks.invalidateCurrentUser(queryClient);
                authenticationSession.logOut();
                reset();
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{t('Logout')}</span>
          </TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}