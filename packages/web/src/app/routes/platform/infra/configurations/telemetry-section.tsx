import { PlatformConfigurationSettings } from '@activepieces/shared';
import { t } from 'i18next';
import { Activity, Server } from 'lucide-react';
import { Control } from 'react-hook-form';

import { PageSection } from '@/components/custom/page';
import { Panel, SettingRows } from '@/components/custom/panel';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item';
import { Switch } from '@/components/ui/switch';

import { TrackedEventsDialog } from './tracked-events-dialog';

export const TelemetrySection = ({
  control,
  disabled,
}: TelemetrySectionProps) => {
  return (
    <PageSection
      title={t('Telemetry')}
      description={t(
        'Help us improve Activepieces. We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
      )}
    >
      <Panel flush>
        <SettingRows>
          <Item>
            <ItemMedia variant="icon">
              <Activity />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('Product analytics')}</ItemTitle>
              <ItemDescription className="line-clamp-none">
                {t(
                  'Shares usage events so we can see which features are used and fix what breaks.',
                )}
              </ItemDescription>
              <TrackedEventsDialog />
            </ItemContent>
            <ItemActions>
              <FormField
                control={control}
                name="isProductTelemetryEnabled"
                render={({ field }) => (
                  <FormItem>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ItemActions>
          </Item>
          <Item>
            <ItemMedia variant="icon">
              <Server />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{t('Deployment setup')}</ItemTitle>
              <ItemDescription className="line-clamp-none">
                {t(
                  'Sends a snapshot of your Workers and Health pages, without IPs or hostnames, so we can answer your support questions faster.',
                )}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <FormField
                control={control}
                name="isInfraSetupTelemetryEnabled"
                render={({ field }) => (
                  <FormItem>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ItemActions>
          </Item>
        </SettingRows>
      </Panel>
    </PageSection>
  );
};

type TelemetrySectionProps = {
  control: Control<PlatformConfigurationSettings>;
  disabled: boolean;
};
