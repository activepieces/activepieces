import { DialogTrigger } from '@radix-ui/react-dialog';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Workflow } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { projectHooks } from '@/hooks/project-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import {
  AppConnectionWithoutSensitiveData,
  FlowVersionState,
  PopulatedFlow,
} from '@activepieces/shared';

import { ConnectionFlowCard } from './connection-flow-card';

type FlowsDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
};

const FlowsDialog = React.memo(({ connection }: FlowsDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const projectId = authenticationSession.getProjectId()!;
  const { project } = projectHooks.useCurrentProject();
  const isInPlatformAdmin = window.location.pathname.includes('/platform/');

  const { data: flows = [], isLoading } = useQuery<Array<PopulatedFlow>>({
    queryKey: ['connection-flows', connection.id],
    queryFn: () =>
      flowsApi
        .list({
          projectId: projectId,
          connectionExternalIds: [connection.externalId],
          cursor: undefined,
          limit: 1000,
          versionState: FlowVersionState.LOCKED,
        })
        .then((res) => res.data),
    enabled: dialogOpen,
    retry: false,
  });

  return (
    <Tooltip>
      <Dialog open={dialogOpen} onOpenChange={(open) => setDialogOpen(open)}>
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setDialogOpen(true);
                }}
              >
                <Workflow className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Show flows')}</p>
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent className="flex flex-col sm:max-w-[525px] p-6 gap-6">
          <DialogHeader className="space-y-3">
            <DialogTitle>{t('Flows Using This Connection')}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground leading-normal">
              <>
                {t('List of flows that are using')}{' '}
                <span className="font-bold text-foreground">
                  {connection.displayName}
                </span>{' '}
                {t('in')}{' '}
                {isInPlatformAdmin ? (
                  <span className="font-bold text-foreground">
                    {t('all projects')}
                  </span>
                ) : (
                  <span className="font-bold text-foreground">
                    {project.displayName}
                  </span>
                )}
              </>
            </DialogDescription>
          </DialogHeader>

          <ScrollArea
            className={cn(
              'h-[275px]',
              (isLoading || flows.length === 0) && 'h-[80px]',
            )}
          >
            {isLoading ? (
              <div className="flex justify-center items-center w-full h-[80px]">
                <LoadingSpinner className="h-6 w-6 text-primary" />
              </div>
            ) : flows.length === 0 ? (
              <div className="flex justify-center items-center h-[80px] text-muted-foreground">
                {t('No flows are using this connection')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {flows.map((flow: PopulatedFlow, index: number) => (
                  <ConnectionFlowCard key={index} flow={flow} />
                ))}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
            >
              {t('Close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
});

FlowsDialog.displayName = 'FlowsDialog';
export { FlowsDialog };
