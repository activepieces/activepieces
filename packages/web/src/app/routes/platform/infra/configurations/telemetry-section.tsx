import { PlatformConfigurationSettings } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, Server } from 'lucide-react';
import { Control } from 'react-hook-form';

import { SettingsPanel, SettingsRow } from '@/app/components/admin';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { TrackedEventsDialog } from './tracked-events-dialog';

export const TelemetrySection = ({
  control,
  disabled,
}: TelemetrySectionProps) => {
  return (
    <SettingsPanel
      title={t('Telemetry')}
      description={t(
        'Help us improve Activepieces. We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
      )}
      flush
    >
      <SettingsRow
        icon={<Activity />}
        title={t('Product analytics')}
        description={
          <div className="flex flex-col items-start gap-2">
            {t(
              'Shares usage events so we can see which features are used and fix what breaks.',
            )}
            <TrackedEventsDialog />
          </div>
        }
      >
        <FormField
          control={control}
          name="isProductTelemetryEnabled"
          render={({ field }) => (
            <FormItem>
              <Switch
                aria-label={t('Product analytics')}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsRow>
      <SettingsRow
        icon={<Server />}
        title={t('Deployment setup')}
        description={t(
          'Sends a snapshot of your Workers and Health pages, without IPs or hostnames, so we can answer your support questions faster.',
        )}
      >
        <FormField
          control={control}
          name="isInfraSetupTelemetryEnabled"
          render={({ field }) => (
            <FormItem>
              <Switch
                aria-label={t('Deployment setup')}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </SettingsRow>
    </SettingsPanel>
  );
};

type TelemetrySectionProps = {
  control: Control<PlatformConfigurationSettings>;
  disabled: boolean;
};
