import { isNil } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RoleSelector } from '@/features/members/component/role-selector';
import { projectRoleApi } from '@/features/platform-admin/lib/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';

type ProjectRoleSelectProps = {
  form: UseFormReturn<any>;
};

export const ProjectRoleSelect = ({ form }: ProjectRoleSelectProps) => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data: rolesData } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled:
      !isNil(platform.plan.projectRolesEnabled) &&
      platform.plan.projectRolesEnabled,
  });

  const roles = rolesData?.data ?? [];
  const defaultProjectRole =
    roles?.find((role) => role.name === 'Editor')?.name || roles?.[0]?.name;

  useEffect(() => {
    if (roles.length > 0 && defaultProjectRole) {
      const current = form.getValues('projectRole');
      if (!current) {
        form.setValue('projectRole', defaultProjectRole);
      }
    }
  }, [roles.length, defaultProjectRole, form]);

  return (
    <FormField
      control={form.control}
      name="projectRole"
      render={({ field }) => (
        <FormItem className="grid gap-3">
          <Label>{t('Project Role')}</Label>
          <RoleSelector
            type="project"
            value={field.value || defaultProjectRole}
            onValueChange={field.onChange}
            roles={roles}
            placeholder={t('Select a project role')}
            showDescriptionInTrigger={true}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
