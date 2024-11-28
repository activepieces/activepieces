import { t } from 'i18next';
import { LogOut, Shield } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { ProjectSwitcher } from '@/features/projects/components/project-switcher';
import { InviteUserDialog } from '@/features/team/component/invite-user-dialog';
import { useShowPlatformAdminDashboard } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import { ApFlagId, isNil } from '@activepieces/shared';

import { useEmbedding } from '../../components/embed-provider';
import { Separator } from '../../components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../../components/ui/tooltip';

import { FlagGuard } from './flag-guard';
import { useSocket } from '@/components/socket-provider';
import { flagsHooks } from '@/hooks/flags-hooks';
import { useQuery } from '@tanstack/react-query';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { MessagesBuilder } from '../routes/platform/notifications/messages-builder';
import { Message } from '../routes/platform/notifications/message';

export const Header = () => {
  const history = useLocation();
  const isInPlatformAdmin = history.pathname.startsWith('/platform');
  const showPlatformAdminDashboard = useShowPlatformAdminDashboard();
  const { embedState } = useEmbedding();
  const [messages, setMessages] = useState<Message[]>([]);
  const { data: currentVersion } = flagsHooks.useFlag<string>(ApFlagId.CURRENT_VERSION);
  const { data: latestVersion } = flagsHooks.useFlag<string>(ApFlagId.LATEST_VERSION);
  const socket = useSocket();
  const { data: providers, isLoading } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
  });

  useEffect(() => {
    const newMessages = MessagesBuilder(currentVersion, latestVersion, socket.connected, providers, isLoading);
    setMessages(newMessages);
  }, [socket.connected, currentVersion, latestVersion, providers, isLoading]);
  
  return (
    !embedState.isEmbedded && (
      <div>
        <div className="flex h-[60px] items-center">
          {isInPlatformAdmin ? (
            <span className="text-3xl font-bold px-4 py-2">
              {t('Platform Admin')}
            </span>
          ) : (
            <ProjectSwitcher />
          )}
          <div className="grow"></div>
          <div className="flex items-center justify-center gap-4">
            <InviteUserDialog></InviteUserDialog>
            {showPlatformAdminDashboard && (
              <Link to={isInPlatformAdmin ? '/' : '/platform'}>
                <Button
                  variant={'outline'}
                  size="sm"
                  className="flex items-center justify-center gap-2 relative"
                >
                  {isInPlatformAdmin ? (
                    <LogOut className="size-4" />
                  ) : (
                    <Shield className="size-4" />
                  )}
                  <span>
                    {t(
                      isInPlatformAdmin
                        ? 'Exit Platform Admin'
                        : 'Platform Admin',
                    )}
                  </span>

                  {messages.length && !isInPlatformAdmin && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-destructive-300 text-white text-xs rounded-full flex items-center justify-center">
                    </span>
                  )}
                </Button>
              </Link>
            )}

            <TaskLimitButton />
            <UserAvatar />
          </div>
        </div>
        <Separator></Separator>
      </div>
    )
  );
};

const TaskLimitButton = React.memo(() => {
  const { project } = projectHooks.useCurrentProject();

  if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
    return null;
  }

  return (
    <FlagGuard flag={ApFlagId.SHOW_BILLING}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={'/plans'}>
            <Button
              variant={'outline'}
              size="sm"
              className="flex items-center justify-center gap-2"
            >
              <ProgressCircularComponent
                size="small"
                data={{
                  plan: project.plan.tasks,
                  usage: project.usage.tasks,
                }}
              />
              {t('View Usage')}
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <strong>{t('Tasks')}:</strong>
              <span>
                {formatUtils.formatNumber(project.usage.tasks)}/
                {formatUtils.formatNumber(project.plan.tasks)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <strong>{t('AI Credits')}:</strong>
              <span>
                {formatUtils.formatNumber(project.usage.aiTokens)}/
                {formatUtils.formatNumber(project.plan.aiTokens)}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </FlagGuard>
  );
});
TaskLimitButton.displayName = 'TaskLimitButton';
