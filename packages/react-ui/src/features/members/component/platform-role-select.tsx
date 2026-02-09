import { t } from 'i18next';
import { UseFormReturn } from 'react-hook-form';

import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members/component/role-selector';

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
          <RoleSelector
            type="platform"
            value={field.value}
            onValueChange={field.onChange}
            placeholder={t('Select a platform role')}
          />
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );
};
