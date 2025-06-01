import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlatformRole } from '@activepieces/shared';

type PlatformRoleSelectProps = {
  form: UseFormReturn<any>;
};
export const PlatformRoleSelect = ({ form }: PlatformRoleSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="platformRole"
      render={({ field }) => (
        <FormItem className="grid gap-3">
          <Label>{t('Platform Role')}</Label>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select a platform role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('Platform Role')}</SelectLabel>
                <SelectItem value={PlatformRole.ADMIN}>{t('Admin')}</SelectItem>
                <SelectItem value={PlatformRole.OPERATOR}>
                  {t('Operator')}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );
};
