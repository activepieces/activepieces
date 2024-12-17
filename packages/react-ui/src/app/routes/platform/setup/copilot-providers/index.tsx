import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';

import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { copilotProviderApi } from '@/features/platform-admin-panel/lib/copilot-provider-api';
import { platformHooks } from '@/hooks/platform-hooks';

import { CopilotProviderCard } from './_components/copilot-provider-card';
import { COPILOT_PROVIDERS } from './_components/copilot-providers-config';

export default function CopilotProvidersPage() {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const copilotSettings = platform.copilotSettings;

  const { mutate: deleteProvider, isPending: isDeleting } = useMutation({
    mutationFn: (provider: string) => copilotProviderApi.delete(provider),
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Provider deleted successfully'),
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4 flex">
        <div className="flex justify-between flex-row w-full">
          <div className="flex flex-col gap-2">
            <TableTitle>{t('Copilot Providers')}</TableTitle>
            <div className="text-md text-muted-foreground">
              {t(
                'Set provider credentials that will be used by the Copilot feature when users click the Ask AI button.',
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {COPILOT_PROVIDERS.map((metadata) => (
          <CopilotProviderCard
            key={metadata.value}
            providerMetadata={metadata}
            defaultBaseUrl={metadata.defaultBaseUrl}
            isDeleting={isDeleting}
            onDelete={() => deleteProvider(metadata.value)}
            onSave={() => refetch()}
          />
        ))}
      </div>
    </div>
  );
} 