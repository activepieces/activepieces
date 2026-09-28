import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

import { DestinationKindCard } from '../components/destination-kind-card';
import type { DestinationFormValues } from '../lib/destination-form-utils';
import { destinationKinds } from '../lib/destination-kinds';

export const DestinationStep = ({
  form,
  isEdit,
}: {
  form: UseFormReturn<DestinationFormValues>;
  isEdit: boolean;
}) => {
  const options = destinationKinds.buildOptions();

  return (
    <FormField
      control={form.control}
      name="format"
      render={({ field }) => {
        const selectedKind = destinationKinds.kindOf(field.value);
        return (
          <FormItem className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {t('Where should events go?')}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("This decides the format. You can't change it later.")}
              </span>
            </div>
            <RadioGroup
              className="grid grid-cols-2 gap-3"
              value={selectedKind}
              disabled={isEdit}
              onValueChange={(value) => {
                const kind = destinationKinds.parse(value);
                if (kind === null || kind === selectedKind) {
                  return;
                }
                field.onChange(destinationKinds.defaultFormatOf(kind));
              }}
            >
              {options.map((option) => {
                const isSelected = option.kind === selectedKind;
                const itemId = `destination-kind-${option.kind}`;
                return (
                  <Label
                    key={option.kind}
                    htmlFor={itemId}
                    className={cn(
                      'block rounded-lg border p-4 font-normal transition-shadow',
                      isEdit ? 'cursor-not-allowed' : 'cursor-pointer',
                      isSelected && 'border-primary ring-[3px] ring-primary/15',
                      isEdit && !isSelected && 'opacity-60',
                    )}
                  >
                    <DestinationKindCard
                      option={option}
                      isSelected={isSelected}
                      trailing={
                        <RadioGroupItem id={itemId} value={option.kind} />
                      }
                    />
                  </Label>
                );
              })}
            </RadioGroup>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
