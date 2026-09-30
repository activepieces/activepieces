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
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';
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
        className="flex flex-1 flex-col min-h-0"
        onSubmit={form.handleSubmit((values) => saveConfiguration(values))}
      >
        <Page
          width="narrow"
          footer={
            <Button
              type="submit"
              loading={isPending}
              disabled={!form.formState.isDirty}
            >
              {t('Save')}
            </Button>
          }
        >
          <PageHeader title={t('Configurations')} />
          <TelemetrySection control={form.control} disabled={isPending} />
        </Page>
      </form>
    </Form>
  );
};

const ConfigurationsSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <Page width="narrow" footer={<Button disabled>{t('Save')}</Button>}>
        <PageHeader title={t('Configurations')} />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Panel>
          <Skeleton className="h-16 w-full" />
        </Panel>
      </Page>
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
