import { UpdatePlatformConfigurationRequestBody } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';

import { TrackedEventsDialog } from './tracked-events-dialog';

export function TelemetryPanel() {
  const queryClient = useQueryClient();
  const {
    data: configuration,
    isLoading,
    isError,
    refetch,
  } = platformConfigurationHooks.useCurrentPlatformConfiguration({
    refetchOnMount: 'always',
  });
  const { mutate: save, isPending } = useMutation({
    mutationFn: (request: UpdatePlatformConfigurationRequestBody) =>
      platformConfigurationApi.update(request),
    onSuccess: async (_saved, request) => {
      await queryClient.invalidateQueries({
        queryKey: platformConfigurationHooks.queryKey,
      });
      if (request.isProductTelemetryEnabled !== undefined) {
        window.location.reload();
      }
    },
    onError: () => toast.error(t('Failed to save changes. Please try again.')),
  });

  return (
    <Panel
      title={t('Telemetry')}
      description={t(
        'What this self-hosted platform shares with us. We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
      )}
      flush
    >
      {isError ? (
        <DataFetchErrorState
          entity={t('telemetry settings')}
          onRetry={() => refetch()}
        />
      ) : (
        <SettingRows>
          <SettingRow
            title={t('Product analytics')}
            description={t(
              'Which features are used and what breaks, so we can fix it.',
            )}
          >
            <TrackedEventsDialog />
            {isLoading || !configuration ? (
              <Skeleton className="h-5 w-9 rounded-full" />
            ) : (
              <Switch
                aria-label={t('Product analytics')}
                checked={configuration.isProductTelemetryEnabled}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  save({ isProductTelemetryEnabled: checked })
                }
              />
            )}
          </SettingRow>
          <SettingRow
            title={t('Deployment setup')}
            description={t(
              'A snapshot of your Workers and Health pages, without IPs or hostnames, so support can answer faster.',
            )}
          >
            {isLoading || !configuration ? (
              <Skeleton className="h-5 w-9 rounded-full" />
            ) : (
              <Switch
                aria-label={t('Deployment setup')}
                checked={configuration.isInfraSetupTelemetryEnabled}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  save({ isInfraSetupTelemetryEnabled: checked })
                }
              />
            )}
          </SettingRow>
        </SettingRows>
      )}
    </Panel>
  );
}
