import { PlatformConfigurationSettings } from '@activepieces/shared';
import { t } from 'i18next';
import { Control } from 'react-hook-form';

import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { FormField } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { TrackedEventsDialog } from './tracked-events-dialog';

export const TelemetrySection = ({
  control,
  disabled,
}: TelemetrySectionProps) => {
  return (
    <Panel
      title={t('Telemetry')}
      description={t(
        'We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
      )}
      flush
    >
      <SettingRows>
        <SettingRow
          title={t('Product analytics')}
          description={t(
            'Which features are used and what breaks, so we can fix it.',
          )}
        >
          <TrackedEventsDialog />
          <FormField
            control={control}
            name="isProductTelemetryEnabled"
            render={({ field }) => (
              <Switch
                aria-label={t('Product analytics')}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
        </SettingRow>
        <SettingRow
          title={t('Deployment setup')}
          description={t(
            'A snapshot of your Workers and Health pages, without IPs or hostnames, so support can answer faster.',
          )}
        >
          <FormField
            control={control}
            name="isInfraSetupTelemetryEnabled"
            render={({ field }) => (
              <Switch
                aria-label={t('Deployment setup')}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
        </SettingRow>
      </SettingRows>
    </Panel>
  );
};

type TelemetrySectionProps = {
  control: Control<PlatformConfigurationSettings>;
  disabled: boolean;
};
