import { t } from 'i18next';
import { Lock } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

import { DictionaryInput } from '@/components/custom/dictionary-input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import type { DestinationFormValues } from '../lib/destination-form-utils';

export const HeadersField = ({
  form,
  isEdit,
  keyPlaceholder,
}: {
  form: UseFormReturn<DestinationFormValues>;
  isEdit: boolean;
  keyPlaceholder: string;
}) => {
  return (
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
              keyPlaceholder={keyPlaceholder}
              valuePlaceholder={
                isEdit ? t('Hidden — type to replace') : t('Value')
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
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
