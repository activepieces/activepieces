import { AIProviderName, tryCatch } from '@activepieces/core-utils';
import { t } from 'i18next';
import { KeyRound } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageColumns, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import {
  aiProviderMutations,
  aiProviderQueries,
} from '@/features/platform-admin';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

import { aiKeyFormat } from './ai-key-format';
import { ConfigDetail } from './providers-tab/config-detail';
import { useAiKeyActions } from './use-ai-key-actions';

export function AIKeyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: providers,
    isLoading,
    isError,
    refetch,
  } = aiProviderQueries.useAiProviderConfigs();
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();
  const actions = useAiKeyActions({
    refetch,
    onConnected: (createdId) => navigate(`/platform/ai/keys/${createdId}`),
    onDeleted: () => navigate('/platform/ai'),
  });
  const { mutateAsync: updateProvider, isPending: isSaving } =
    aiProviderMutations.useUpdateAiProvider({
      onSuccess: () => {
        refetch();
        toast.success(t('Saved'));
      },
      onError: (error) => {
        const data = error.response?.data;
        toast.error(
          t(
            data?.params?.message ?? data?.message ?? 'Could not save this key',
          ),
        );
      },
    });

  if (!platform.plan.aiProvidersEnabled) {
    return <Navigate to="/platform/ai" replace />;
  }

  const back = { label: t('AI providers'), to: '/platform/ai' };

  if (isLoading) {
    return (
      <Page>
        <PageHeader back={back} title={<Skeleton className="h-8 w-48" />} />
        <PageColumns
          main={<Skeleton className="h-64 rounded-2xl" />}
          aside={<Skeleton className="h-48 rounded-2xl" />}
        />
      </Page>
    );
  }

  if (isError) {
    return (
      <Page>
        <PageHeader back={back} title={t('AI key')} />
        <Panel flush>
          <DataFetchErrorState entity={t('this key')} onRetry={refetch} />
        </Panel>
      </Page>
    );
  }

  const config = (providers ?? []).find(
    (provider) =>
      provider.id === id && provider.provider !== AIProviderName.ACTIVEPIECES,
  );
  const info = config
    ? aiKeyFormat.providerInfo({ provider: config.provider })
    : undefined;

  if (!config || !info) {
    return (
      <Page>
        <PageHeader back={back} title={t('AI key')} />
        <Panel flush>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <KeyRound />
              </EmptyMedia>
              <EmptyTitle>{t('This key no longer exists')}</EmptyTitle>
              <EmptyDescription>
                {t(
                  'It may have been deleted. Your other keys are on the AI page.',
                )}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                onClick={() => navigate('/platform/ai')}
              >
                {t('Back to AI')}
              </Button>
            </EmptyContent>
          </Empty>
        </Panel>
      </Page>
    );
  }

  return (
    <>
      <ConfigDetail
        key={`${config.id}:${actions.credentialsVersion}`}
        config={config}
        info={info}
        projects={projects}
        isSaving={isSaving}
        onSave={(request) =>
          tryCatch(() => updateProvider({ providerId: config.id, request }))
        }
        onDelete={() => actions.askToDelete(config)}
        onReplaceCredentials={() => actions.replaceCredentials(config)}
        isRechecking={actions.isRechecking}
        onRecheck={() => actions.recheck(config)}
      />
      {actions.dialogs}
    </>
  );
}
