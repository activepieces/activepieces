import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformConfiguration,
  PlatformConfigurationSettings,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import {
  AdminPage,
  AdminPageHeader,
  SaveBar,
  SettingsPanel,
  SettingsRow,
  adminPageResources,
} from '@/app/components/admin';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';

import { TelemetrySection } from './telemetry-section';

export const ConfigurationsPage = () => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: configuration, isLoading } =
    platformConfigurationHooks.useCurrentPlatformConfiguration({
      refetchOnMount: 'always',
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });

  if (edition === ApEdition.CLOUD) {
    return <Navigate to="/platform/workers" replace />;
  }

  if (isLoading || isNil(configuration)) {
    return <ConfigurationsSkeleton />;
  }

  return <ConfigurationsContent configuration={configuration} />;
};

const ConfigurationsContent = ({
  configuration,
}: ConfigurationsContentProps) => {
  const queryClient = useQueryClient();

  const form = useForm<PlatformConfigurationSettings>({
    defaultValues: toFormValues(configuration),
    resolver: zodResolver(PlatformConfigurationSettings),
    mode: 'onChange',
  });

  const { mutate: saveConfiguration, isPending } = useMutation({
    mutationFn: (values: PlatformConfigurationSettings) =>
      platformConfigurationApi.update(values),
    onSuccess: async (saved) => {
      const productAnalyticsChanged =
        form.formState.defaultValues?.isProductTelemetryEnabled !==
        saved.isProductTelemetryEnabled;
      form.reset(toFormValues(saved));
      await queryClient.invalidateQueries({
        queryKey: platformConfigurationHooks.queryKey,
      });
      if (productAnalyticsChanged) {
        window.location.reload();
        return;
      }
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
    },
    onError: () => {
      toast.error(t('Failed to save changes. Please try again.'));
    },
  });

  return (
    <Form {...form}>
      <form
        className="flex flex-1 flex-col"
        onSubmit={form.handleSubmit((values) => saveConfiguration(values))}
      >
        <AdminPage
          width="narrow"
          footer={
            <SaveBar
              width="narrow"
              dirty={form.formState.isDirty}
              saving={isPending}
              onDiscard={() => form.reset()}
            />
          }
        >
          <ConfigurationsHeader />
          <TelemetrySection control={form.control} disabled={isPending} />
        </AdminPage>
      </form>
    </Form>
  );
};

const ConfigurationsHeader = () => (
  <AdminPageHeader
    title={t('Configurations')}
    resources={adminPageResources.configurations}
  />
);

const ConfigurationsSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col">
      <AdminPage
        width="narrow"
        footer={<SaveBar width="narrow" dirty={false} saving={false} />}
      >
        <ConfigurationsHeader />
        <SettingsPanel
          title={t('Telemetry')}
          description={t(
            'Help us improve Activepieces. We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
          )}
          flush
        >
          {[0, 1].map((row) => (
            <SettingsRow
              key={row}
              icon={<Skeleton className="size-4" />}
              title={<Skeleton className="h-4 w-32" />}
              description={<Skeleton className="h-4 w-full" />}
            >
              <Skeleton className="h-5 w-9 rounded-full" />
            </SettingsRow>
          ))}
        </SettingsPanel>
      </AdminPage>
    </div>
  );
};

const toFormValues = (
  configuration: PlatformConfiguration,
): PlatformConfigurationSettings => ({
  isProductTelemetryEnabled: configuration.isProductTelemetryEnabled,
  isInfraSetupTelemetryEnabled: configuration.isInfraSetupTelemetryEnabled,
  maxBarrierSignals: configuration.maxBarrierSignals,
});

type ConfigurationsContentProps = {
  configuration: PlatformConfiguration;
};
