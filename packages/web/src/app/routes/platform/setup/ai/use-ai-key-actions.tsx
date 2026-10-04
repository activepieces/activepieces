import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderWithoutSensitiveData } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { aiProviderKeys, aiProviderMutations } from '@/features/platform-admin';

import { ConnectProviderDialog } from './providers-tab/connect-provider-dialog';
import { keyStatusText } from './providers-tab/key-status';

export function useAiKeyActions({
  refetch,
  onConnected,
  onDeleted,
}: {
  refetch: () => Promise<unknown>;
  onConnected?: (createdId: string) => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<
    AIProviderWithoutSensitiveData | undefined
  >(undefined);
  const [dialogProvider, setDialogProvider] = useState<
    AIProviderName | undefined
  >(undefined);
  const [deleting, setDeleting] =
    useState<AIProviderWithoutSensitiveData | null>(null);
  const [credentialsVersion, setCredentialsVersion] = useState(0);

  const { mutateAsync: deleteProvider } =
    aiProviderMutations.useDeleteAiProvider({
      onSuccess: () => refetch(),
    });
  const { mutate: recheckProvider, isPending: isRechecking } =
    aiProviderMutations.useRecheckAiProvider({
      onSuccess: ({ status }) => {
        refetch();
        const label = keyStatusText({ status });
        if (status === 'active') {
          toast.success(label ?? t('Saved'));
          return;
        }
        toast.error(label ?? t('Could not reach this provider'));
      },
    });

  const connect = (provider?: AIProviderName) => {
    setEditing(undefined);
    setDialogProvider(provider);
    setDialogOpen(true);
  };
  const replaceCredentials = (config: AIProviderWithoutSensitiveData) => {
    setEditing(config);
    setDialogProvider(undefined);
    setDialogOpen(true);
  };
  const handleConnected = async (createdId?: string) => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({
        queryKey: aiProviderKeys.configModels(),
      }),
    ]);
    toast.success(t('Saved'));
    if (createdId) {
      onConnected?.(createdId);
      return;
    }
    setCredentialsVersion((version) => version + 1);
  };

  const dialogs = (
    <>
      <ConnectProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultProvider={dialogProvider}
        onConnected={handleConnected}
      />
      {deleting && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setDeleting(null)}
          title={t('Delete {name}?', { name: deleting.name })}
          description={t(
            'The credentials are removed and cannot be recovered. Reconnecting the provider means entering them again.',
          )}
          consequence={t('Steps and agents using this key stop working.')}
          typeToConfirm={deleting.name}
          successMessage={t('Deleted {name}', { name: deleting.name })}
          confirmLabel={t('Delete key')}
          onConfirm={async () => {
            await deleteProvider(deleting.id);
            onDeleted?.();
          }}
        />
      )}
    </>
  );

  return {
    connect,
    replaceCredentials,
    recheck: (config: AIProviderWithoutSensitiveData) =>
      recheckProvider(config.id),
    isRechecking,
    askToDelete: setDeleting,
    credentialsVersion,
    dialogs,
  };
}
