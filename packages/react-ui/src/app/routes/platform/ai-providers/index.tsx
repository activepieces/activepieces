import { AiProviders } from '@activepieces/pieces-common';
import { t } from 'i18next';
import { AIProviderCard } from './ai-provider-card';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiProviderApi } from '@/features/platform-admin-panel/lib/ai-provider-api';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function AIProvidersPage() {

  const queryClient = useQueryClient()

  const { data: providers, refetch, isLoading  } = useQuery({
    queryKey: ['ai-providers'],
    queryFn: () => aiProviderApi.list(),
    networkMode: "online"
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
          AiProviders.map(metadata => {
            const provider = providers?.data.find(c => c.provider === metadata.value)
            return isLoading ? <Skeleton className="h-24 w-full" /> : <AIProviderCard
              providerMetadata={metadata}
              defaultBaseUrl={provider?.baseUrl ?? metadata.defaultBaseUrl}
              provider={provider ? { ...provider, config: { defaultHeaders: {} } } : undefined}
              isDeleting={isDeleting}
              onDelete={() => deleteProvider(metadata.value)}
              onSave={() => {
                queryClient.invalidateQueries({ queryKey: ['ai-providers'] })
                refetch()
              }}
            />
          })
        }
      </div>
    </div>
  );
}
