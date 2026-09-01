import { t } from 'i18next';
import { Activity, Server } from 'lucide-react';
import { Control } from 'react-hook-form';

import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/custom/item';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

import { ConfigurationsFormValues } from './configurations-form';
import { TrackedEventsDialog } from './tracked-events-dialog';

export const TelemetrySection = ({
  control,
  disabled,
}: TelemetrySectionProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('Telemetry')}</h2>
        <p className="text-sm text-muted-foreground">
          {t(
            'Help us improve Activepieces. We never receive what your flows do, the data they process, or anything inside your connections and API keys.',
          )}
        </p>
      </div>
      <Item variant="outline">
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
      <Item variant="outline">
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
    </div>
  );
};

type TelemetrySectionProps = {
  control: Control<ConfigurationsFormValues>;
  disabled: boolean;
};
