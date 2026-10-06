import { t } from 'i18next';
import { Lock, Plus, TrashIcon } from 'lucide-react';
import { useId } from 'react';
import { UseFormReturn, useFieldArray, useWatch } from 'react-hook-form';

import { MaskedInput } from '@/components/custom/masked-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import type { DestinationFormValues } from '../lib/destination-form-utils';

export const HeadersField = ({
  form,
  storedHeaderNames,
  keyPlaceholder,
}: {
  form: UseFormReturn<DestinationFormValues>;
  storedHeaderNames: string[];
  keyPlaceholder: string;
}) => {
  const headingId = useId();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'headers',
  });
  const rows = useWatch({ control: form.control, name: 'headers' });
  const storedLowerCaseNames = new Set(
    storedHeaderNames.map((name) => name.toLowerCase()),
  );
  const isStoredRow = (index: number) =>
    storedLowerCaseNames.has((rows[index]?.name ?? '').toLowerCase());

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="flex flex-col gap-2"
    >
      <span id={headingId} className="text-sm font-medium">
        {t('Headers')}
      </span>
      {fields.map((row, index) => (
        <div key={row.id} className="flex items-start gap-3">
          <FormField
            control={form.control}
            name={`headers.${index}.name`}
            rules={{ deps: ['headers'] }}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input
                    {...field}
                    aria-label={t('Header name')}
                    placeholder={keyPlaceholder}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`headers.${index}.value`}
            rules={{ deps: ['headers'] }}
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <MaskedInput
                    {...field}
                    aria-label={t('Header value')}
                    placeholder={
                      isStoredRow(index)
                        ? t('Hidden — type to replace')
                        : t('Value')
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => {
              remove(index);
              form.trigger('headers').catch(() => undefined);
            }}
          >
            <TrashIcon className="size-4 text-danger-11" aria-hidden="true" />
            <span className="sr-only">{t('Remove')}</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => append({ name: '', value: '' })}
      >
        <Plus className="size-4" />
        {t('Add header')}
      </Button>
    </div>
  );
};

export const EncryptedHeadersNotice = () => {
  return (
    <Alert>
      <Lock className="size-4" />
      <AlertTitle>{t('Header values are encrypted')}</AlertTitle>
      <AlertDescription>
        {t('After you save, a value can be replaced but not read back.')}
      </AlertDescription>
    </Alert>
  );
};
