import { tryCatch } from '@activepieces/core-utils';
import { PlatformAppConnectionsListItem } from '@activepieces/shared';
import { t } from 'i18next';

import {
  ConfirmDialog,
  adminBulk,
  useAdminAction,
} from '@/app/components/admin';
import { DeleteConnectionWarning } from '@/components/custom/global-connection-utils';
import { globalConnectionsApi } from '@/features/connections/api/global-connections';
import { AdminControl } from '@/lib/admin-control';

export const DeleteConnectionsDialog = ({
  connections,
  open,
  onOpenChange,
  onDeleted,
  onFinished,
  onPartialFailure,
}: DeleteConnectionsDialogProps) => {
  const deleteConnections = useAdminAction<PlatformAppConnectionsListItem[]>({
    verb: 'delete',
    name: (rows) =>
      rows.length === 1 && rows[0]
        ? rows[0].displayName
        : connectionsLabel(rows.length),
    run: async (rows) => {
      try {
        await adminBulk.runEach({
          items: rows,
          run: (row) => globalConnectionsApi.delete(row.id),
          verb: 'delete',
          label: connectionsLabel,
          nameOf: (row) => row.displayName,
        });
      } finally {
        onDeleted();
      }
    },
  });
  const [single] = connections;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        connections.length === 1 && single
          ? t('Delete {name}?', { name: single.displayName })
          : t(
              '{count, plural, =1 {Delete 1 connection?} other {Delete # connections?}}',
              { count: connections.length },
            )
      }
      description={t(
        '{count, plural, =1 {The credentials are removed from the platform and from every project the connection is shared with.} other {Their credentials are removed from the platform and from every project they are shared with.}} Nothing is changed at the provider.',
        { count: connections.length },
      )}
      consequence={<DeleteConnectionWarning />}
      confirmLabel={t('Delete')}
      controlId={AdminControl.CONNECTIONS_CONNECTION_DELETE_CONFIRM}
      onConfirm={async () => {
        const { error } = await tryCatch(() =>
          deleteConnections.mutateAsync(connections),
        );
        if (error) {
          if (adminBulk.isPartialFailure(error)) {
            onPartialFailure(
              adminBulk.failedItems({ error, items: connections }),
            );
          }
          throw error;
        }
        onFinished();
      }}
    />
  );
};

function connectionsLabel(count: number): string {
  return t('{count, plural, =1 {# connection} other {# connections}}', {
    count,
  });
}

type DeleteConnectionsDialogProps = {
  connections: PlatformAppConnectionsListItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
  onFinished: () => void;
  onPartialFailure: (failed: PlatformAppConnectionsListItem[]) => void;
};
