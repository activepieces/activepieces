import {
  maxBarrierSignalsBounds,
  PlatformConfigurationSettings,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Split } from 'lucide-react';
import { Control } from 'react-hook-form';

import { PageSection } from '@/components/custom/page';
import { Panel, SettingRows } from '@/components/custom/panel';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from '@/components/ui/item';

export const LimitsSection = ({ control, disabled }: LimitsSectionProps) => {
  return (
    <PageSection
      title={t('Limits')}
      description={t(
        'Guardrails that apply to every project on this platform.',
      )}
    >
      <Panel flush>
        <SettingRows>
          <FormField
            control={control}
            name="maxBarrierSignals"
            render={({ field }) => (
              <FormItem className="gap-0">
                <Item>
                  <ItemMedia variant="icon">
                    <Split />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {t('Max things one step can wait on')}
                    </ItemTitle>
                    <ItemDescription className="line-clamp-none">
                      {t(
                        'A step that waits on more than this fails when it runs. Every thing waited on costs database rows, so raise it only as far as your database can carry.',
                      )}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Input
                      {...field}
                      id="maxBarrierSignals"
                      type="number"
                      min={maxBarrierSignalsBounds.min}
                      max={maxBarrierSignalsBounds.max}
                      className="w-28"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                      disabled={disabled}
                    />
                  </ItemActions>
                </Item>
                <FormMessage />
              </FormItem>
            )}
          />
        </SettingRows>
      </Panel>
    </PageSection>
  );
};

type LimitsSectionProps = {
  control: Control<PlatformConfigurationSettings>;
  disabled: boolean;
};
