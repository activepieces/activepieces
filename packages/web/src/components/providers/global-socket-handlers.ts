import { WebsocketClientEvent } from '@activepieces/shared';
import { t } from 'i18next';
import { Socket } from 'socket.io-client';
import { toast } from 'sonner';

export function registerGlobalSocketHandlers(socket: Socket): () => void {
  const handleMigrationCompleted = ({
    updatedFlows,
  }: {
    updatedFlows: number;
  }) => {
    toast.success(
      updatedFlows === 0
        ? t('Migration completed. No flows have been updated.')
        : t('Migration completed. {count} flow(s) updated.', {
            count: updatedFlows,
          }),
    );
  };

  socket.on(
    WebsocketClientEvent.FLOWS_MODEL_MIGRATION_COMPLETED,
    handleMigrationCompleted,
  );

  return () => {
    socket.off(
      WebsocketClientEvent.FLOWS_MODEL_MIGRATION_COMPLETED,
      handleMigrationCompleted,
    );
  };
}
