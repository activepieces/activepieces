import {
  maxBarrierSignalsBounds,
  PlatformConfigurationSettings,
} from '@activepieces/shared';
import { SplitIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Control } from 'react-hook-form';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('Limits')}</h2>
        <p className="text-sm text-gray-11">
          {t('Guardrails that apply to every project on this platform.')}
        </p>
      </div>
      <FormField
        control={control}
        name="maxBarrierSignals"
        render={({ field }) => (
          <FormItem>
            <Item variant="outline">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={SplitIcon} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{t('Max things one step can wait on')}</ItemTitle>
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
    </div>
  );
};

type LimitsSectionProps = {
  control: Control<PlatformConfigurationSettings>;
  disabled: boolean;
};
