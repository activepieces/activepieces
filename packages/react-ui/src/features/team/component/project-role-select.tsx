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
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { DEFAULT_FREE_PLAN_LIMIT } from '@activepieces/ee-shared';
import { ApFlagId, DefaultProjectRole } from '@activepieces/shared';

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
  const { project } = projectHooks.useCurrentProject();

  const { data: isCloudPlatform } = flagsHooks.useFlag<boolean>(
    ApFlagId.IS_CLOUD_PLATFORM,
  );

  const invitationRoles = Object.values(DefaultProjectRole)
    .filter((f) => {
      if (f === DefaultProjectRole.ADMIN) {
        return true;
      }
      const showNonAdmin =
        !isCloudPlatform ||
        project?.plan.teamMembers !== DEFAULT_FREE_PLAN_LIMIT.teamMembers;
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
