import { AiProviders } from '@activepieces/pieces-common';
import { t } from 'i18next';
import { AIProviderCard } from './ai-provider-card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';

export default function AIProvidersPage() {

  const { data: providers, refetch } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
  })

  const { mutate: deleteProvider, isPending: isDeleting } = useMutation({
    mutationFn: (provider: string) => aiProviderApi.delete(provider),
    onSuccess: () => {
      refetch()
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST)
    }
  })

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4 flex">
        <div className="flex justify-between flex-row w-full">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold w-full">
              {t('AI Providers')}
            </h1>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4">

        {
          AiProviders.map(p => {
            const config = providers?.data.find(c => c.provider === p.value)
            return <AIProviderCard
              auth={p.auth}
              providerName={p.value}
              label={p.label}
              logoUrl={p.logoUrl}
              defaultBaseUrl={config?.baseUrl ?? p.defaultBaseUrl}
              provider={config ? { ...config, config: { defaultHeaders: {} } } : undefined}
              isDeleting={isDeleting}
              onDelete={() => deleteProvider(p.value)}
              onSave={() => refetch()}
            />
          })
        }
      </div>
    </div>
  );
}
