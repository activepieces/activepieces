import { EventDestinationPreset } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Lock } from 'lucide-react';
import { useState } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';

import { DictionaryInput } from '@/components/custom/dictionary-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { DestinationTypeTile } from '../components/destination-type-tile';
import type { DestinationFormValues } from '../lib/destination-form-utils';
import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

export const ConnectionStep = ({
  form,
  isEdit,
  onPresetPicked,
}: {
  form: UseFormReturn<DestinationFormValues>;
  isEdit: boolean;
  onPresetPicked: (mapper: unknown) => void;
}) => {
  const { data: presets } = eventDestinationsCollectionUtils.usePresets();
  const selectedType = useWatch({ control: form.control, name: 'type' });
  const [showAllPresets, setShowAllPresets] = useState(false);

  const allPresets = presets ?? [];
  const isSelectedPresetHidden = allPresets
    .slice(COLLAPSED_PRESET_COUNT)
    .some((preset) => preset.type === selectedType);
  const visiblePresets =
    showAllPresets || isSelectedPresetHidden
      ? allPresets
      : allPresets.slice(0, COLLAPSED_PRESET_COUNT);
  const hiddenPresetCount = allPresets.length - visiblePresets.length;

  const pickPreset = (preset: EventDestinationPreset) => {
    form.setValue('type', preset.type, { shouldValidate: true });
    form.setValue('headers', {
      ...preset.defaultHeaders,
      ...form.getValues('headers'),
    });
    onPresetPicked(preset.defaultMapper);
  };

  return (
    <div className="flex flex-col gap-6">
      <FormField
        control={form.control}
        name="type"
        render={() => (
          <FormItem>
            <FormLabel>{t('Destination type')}</FormLabel>
            <div className="grid grid-cols-4 gap-2.5">
              {visiblePresets.map((preset) => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => pickPreset(preset)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-md border px-2.5 py-3.5 text-sm transition-colors hover:border-primary',
                    selectedType === preset.type &&
                      'border-primary ring-3 ring-primary/15 font-medium',
                  )}
                >
                  <DestinationTypeTile type={preset.type} className="size-7" />
                  {preset.label}
                </button>
              ))}
              {hiddenPresetCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllPresets(true)}
                  className="flex flex-col items-center gap-2 rounded-md border px-2.5 py-3.5 text-sm text-muted-foreground transition-colors hover:border-primary"
                >
                  <ChevronDown className="size-5" />
                  {t('{count} more', { count: hiddenPresetCount })}
                </button>
              )}
            </div>
            <FormDescription>
              {t(
                'Custom JSON lets you write the body yourself. Picking a preset prefills its payload template in the mapping step.',
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Name')}</FormLabel>
            <FormControl>
              <Input placeholder="Loki — production" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="url"
        render={({ field }) => (
          <FormItem>
            <FormLabel showRequiredIndicator>{t('Endpoint URL')}</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/webhook" {...field} />
            </FormControl>
            <FormDescription>
              {t(
                'No endpoint yet? Continue and generate a handler flow in the next step.',
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="headers"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Headers')}</FormLabel>
            <FormControl>
              <DictionaryInput
                values={field.value}
                onChange={field.onChange}
                keyPlaceholder="Authorization"
                valuePlaceholder={
                  isEdit ? t('Hidden — type to replace') : t('Value')
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Alert>
        <Lock className="size-4" />
        <AlertTitle>{t('Header values are encrypted')}</AlertTitle>
        <AlertDescription>
          {t(
            'They are write-only after saving — you can replace a value but not read it back.',
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};

const COLLAPSED_PRESET_COUNT = 3;
