import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { BotIcon, WorkflowIcon } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { DeleteConnectionWarning } from '@/components/custom/global-connection-utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appConnectionsQueries } from '@/features/connections';
import { AdminControl } from '@/lib/admin-control';

function DeleteConnectionsDialog({
  connections,
  title,
  message,
  mutationFn,
  open,
  onOpenChange,
  controlId,
  children,
}: DeleteConnectionsDialogProps) {
  const {
    data: usage,
    isLoading,
    isError,
  } = appConnectionsQueries.useFlowsAndAgentsUsingConnections({
    connections,
    enabled: open,
  });
  const flows = usage?.flows ?? [];
  const agents = usage?.agents ?? [];
  const stillUsed = flows.length > 0 || agents.length > 0;

  return (
    <ConfirmationDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      message={message}
      warning={
        isError ? (
          <DeleteConnectionWarning />
        ) : stillUsed ? (
          <div className="flex flex-col gap-2">
            {t(
              'These still use the connection and stop working if you delete it:',
            )}
            <ScrollArea viewPortClassName="max-h-[250px]">
              <div className="flex flex-wrap gap-1.5">
                {flows.map((flow) => (
                  <Badge
                    key={flow.id}
                    variant="secondary"
                    className="max-w-[200px]"
                  >
                    <WorkflowIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{flow.version.displayName}</span>
                  </Badge>
                ))}
                {agents.map((agent) => (
                  <Badge
                    key={agent.id}
                    variant="secondary"
                    className="max-w-[200px]"
                  >
                    <BotIcon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{agent.displayName}</span>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : undefined
      }
      mutationFn={mutationFn}
      entityName={t('connection')}
      buttonText={t('Delete')}
      confirmDisabled={isLoading || isError}
      controlId={controlId}
      showToast
    >
      {children}
    </ConfirmationDeleteDialog>
  );
}

export { DeleteConnectionsDialog };

type DeleteConnectionsDialogProps = {
  connections: AppConnectionWithoutSensitiveData[];
  title: string;
  message: string;
  mutationFn: () => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  controlId?: AdminControl;
  children?: React.ReactNode;
};
