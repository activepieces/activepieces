import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  PlatformConfiguration,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import { CenteredPage } from '@/app/components/centered-page';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';

import {
  configurationsForm,
  ConfigurationsFormValues,
} from './configurations-form';
import { TelemetrySection } from './telemetry-section';

export const ConfigurationsPage = () => {
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const { data: configuration, isLoading } =
    platformConfigurationHooks.useCurrentPlatformConfiguration({
      refetchOnMount: 'always',
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });

  if (edition === ApEdition.CLOUD) {
    return <Navigate to="/platform/infrastructure/workers" replace />;
  }

  if (isLoading || isNil(configuration)) {
    return <ConfigurationsSkeleton />;
  }

  return <ConfigurationsContent configuration={configuration} />;
};

export default ConfigurationsPage;

const ConfigurationsContent = ({
  configuration,
}: ConfigurationsContentProps) => {
  const queryClient = useQueryClient();

  const form = useForm<ConfigurationsFormValues>({
    defaultValues: configurationsForm.toFormValues(configuration),
    resolver: zodResolver(ConfigurationsFormValues),
    mode: 'onChange',
  });

  const { mutate: saveConfiguration, isPending } = useMutation({
    mutationFn: (values: ConfigurationsFormValues) =>
      platformConfigurationApi.update(values),
    onSuccess: async (saved) => {
      form.reset(configurationsForm.toFormValues(saved));
      await queryClient.invalidateQueries({
        queryKey: platformConfigurationHooks.queryKey,
      });
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
        <CenteredPage
          title={t('Configurations')}
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
          <TelemetrySection control={form.control} disabled={isPending} />
        </CenteredPage>
      </form>
    </Form>
  );
};

const ConfigurationsSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <CenteredPage
        title={t('Configurations')}
        footer={<Button disabled>{t('Save')}</Button>}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-[4.5rem] w-full rounded-lg" />
        </div>
      </CenteredPage>
    </div>
  );
};

type ConfigurationsContentProps = {
  configuration: PlatformConfiguration;
};
