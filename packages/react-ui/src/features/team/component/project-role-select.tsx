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
import { platformHooks } from '@/hooks/platform-hooks';
import { DefaultProjectRole } from '@activepieces/shared';

type ProjectRoleSelectProps = {
  form: UseFormReturn<any>;
};

const RolesDisplayNames: { [k: string]: string } = {
  [DefaultProjectRole.ADMIN]: t('Admin'),
  [DefaultProjectRole.EDITOR]: t('Editor'),
  [DefaultProjectRole.OPERATOR]: t('Operator'),
  [DefaultProjectRole.VIEWER]: t('Viewer'),
};

const ProjectRoleSelect = ({ form }: ProjectRoleSelectProps) => {
  const { platform } = platformHooks.useCurrentPlatform();

  const invitationRoles = Object.values(DefaultProjectRole)
    .filter((f) => {
      if (f === DefaultProjectRole.ADMIN) {
        return true;
      }
      const showNonAdmin = platform.plan.projectRolesEnabled;
      return showNonAdmin;
    })
    .map((role) => {
      return {
        value: role,
        name: RolesDisplayNames[role],
      };
    })
    .map((r) => {
      return (
        <SelectItem key={r.value} value={r.value}>
          {r.name}
        </SelectItem>
      );
    });

  return (
    <FormField
      control={form.control}
      name="role"
      render={({ field }) => (
        <FormItem className="grid gap-3">
          <Label>{t('Project Role')}</Label>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <SelectTrigger>
              <SelectValue placeholder={t('Select a project role')} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('Project Role')}</SelectLabel>
                {invitationRoles}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    ></FormField>
  );
};

export { ProjectRoleSelect };
