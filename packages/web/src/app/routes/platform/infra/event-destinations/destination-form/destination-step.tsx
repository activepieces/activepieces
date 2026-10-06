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
            <RadioGroup
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              value={selectedKind}
              disabled={isEdit}
              onValueChange={(value) => {
                const kind = destinationKinds.parse(value);
                if (kind === null || kind === selectedKind) {
                  return;
                }
                field.onChange(destinationKinds.defaultFormatOf(kind));
                form.setValue('url', '');
                form.setValue('headers', []);
                form.clearErrors(['url', 'headers']);
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
                      'block rounded-xl border p-4 font-normal transition-colors',
                      isEdit ? 'cursor-not-allowed' : 'cursor-pointer',
                      isSelected && 'border-accent-9 bg-accent-2',
                      !isSelected && !isEdit && 'hover:bg-gray-2',
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
