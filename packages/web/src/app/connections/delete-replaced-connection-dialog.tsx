import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { t } from 'i18next';
import { BotIcon, WorkflowIcon } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { DeleteConnectionWarning } from '@/components/custom/global-connection-utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  appConnectionsApi,
  appConnectionsQueries,
} from '@/features/connections';

function DeleteReplacedConnectionDialog({
  connection,
  projectId,
  onClose,
}: DeleteReplacedConnectionDialogProps) {
  const {
    data: usage,
    isLoading,
    isError,
  } = appConnectionsQueries.useFlowsAndAgentsUsingConnection({
    projectId,
    externalId: connection.externalId,
  });
  const flows = usage?.flows ?? [];
  const agents = usage?.agents ?? [];
  const stillUsed = flows.length > 0 || agents.length > 0;

  return (
    <ConfirmationDeleteDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={t('Delete the old connection?')}
      message={t(
        'The replace is done. Delete {name} now, or keep it to use later.',
        { name: connection.displayName },
      )}
      warning={
        isError ? (
          <DeleteConnectionWarning />
        ) : stillUsed ? (
          <div className="flex flex-col gap-2">
            {t(
              'These still use the connection and stop working if you delete it:',
            )}
            <ScrollArea className="max-h-[140px]">
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
      mutationFn={() => appConnectionsApi.delete(connection.id)}
      entityName={t('connection')}
      buttonText={t('Delete')}
      confirmDisabled={isLoading}
      showToast
    />
  );
}

export { DeleteReplacedConnectionDialog };

type DeleteReplacedConnectionDialogProps = {
  connection: AppConnectionWithoutSensitiveData;
  projectId: string;
  onClose: () => void;
};
