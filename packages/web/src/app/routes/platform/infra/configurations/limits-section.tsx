import { t } from 'i18next';
import { Split } from 'lucide-react';
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
import { Input } from '@/components/ui/input';

import type { ConfigurationsFormValues } from './index';

export const LimitsSection = ({ control, disabled }: LimitsSectionProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">{t('Limits')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('Guardrails that apply to every project on this platform.')}
        </p>
      </div>
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Split />
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
          <FormField
            control={control}
            name="maxBarrierSignals"
            render={({ field }) => (
              <FormItem>
                <Input
                  {...field}
                  id="maxBarrierSignals"
                  type="number"
                  min={1}
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
                <FormMessage />
              </FormItem>
            )}
          />
        </ItemActions>
      </Item>
    </div>
  );
};

type LimitsSectionProps = {
  control: Control<ConfigurationsFormValues>;
  disabled: boolean;
};
