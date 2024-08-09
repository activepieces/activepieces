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
          <Label>Platform Role</Label>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder="Select a platform role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Platform Role</SelectLabel>
                <SelectItem value={PlatformRole.ADMIN}>Admin</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );
};
