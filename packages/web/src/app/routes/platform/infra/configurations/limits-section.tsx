import {
  maxBarrierSignalsBounds,
  PlatformConfigurationSettings,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Control } from 'react-hook-form';

import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { FormField } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export const LimitsSection = ({ control, disabled }: LimitsSectionProps) => {
  return (
    <Panel
      title={t('Limits')}
      description={t(
        'Guardrails that apply to every project on this platform.',
      )}
      flush
    >
      <SettingRows>
        <FormField
          control={control}
          name="maxBarrierSignals"
          render={({ field, fieldState }) => (
            <SettingRow
              title={
                <label htmlFor="maxBarrierSignals">
                  {t('Max things one step can wait on')}
                </label>
              }
              description={
                fieldState.error ? (
                  <span className="text-danger-11">
                    {t(fieldState.error.message ?? '')}
                  </span>
                ) : (
                  t(
                    'A step that waits on more than this fails when it runs. Every thing waited on costs database rows, so raise it only as far as your database can carry.',
                  )
                )
              }
            >
              <Input
                {...field}
                id="maxBarrierSignals"
                type="number"
                min={maxBarrierSignalsBounds.min}
                max={maxBarrierSignalsBounds.max}
                className="w-28 text-right tabular-nums"
                value={field.value ?? ''}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? undefined : Number(e.target.value),
                  )
                }
                disabled={disabled}
              />
            </SettingRow>
          )}
        />
      </SettingRows>
    </Panel>
  );
};

type LimitsSectionProps = {
  control: Control<PlatformConfigurationSettings>;
  disabled: boolean;
};
