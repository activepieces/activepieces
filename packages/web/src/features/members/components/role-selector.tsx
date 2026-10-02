import { t } from 'i18next';
import { Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { roleCopy } from '@/features/members/lib/role-copy';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

interface RoleSelectorProps {
  type: 'platform' | 'project';
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  roles?: Array<{ name: string; permissions: string[] }>;
  isLoading?: boolean;
  isAssigningRole?: boolean;
}

export const RoleSelector = ({
  type,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  roles = [],
  isLoading = false,
  isAssigningRole = false,
}: RoleSelectorProps) => {
  const newMemberSettings = platformHooks.useNewMemberSettings();
  const isPlatform = type === 'platform';
  const projectRolesLoading = !isPlatform && isLoading;
  const projectRoleAssigning = !isPlatform && isAssigningRole;
  const showProjectSpinner = projectRolesLoading || projectRoleAssigning;
  const selectDisabled = disabled || showProjectSpinner;

  const label = isPlatform ? t('Platform Roles') : t('Project Roles');

  const options = isPlatform
    ? roleCopy
        .platformRoles({
          personalProjectsEnabled: newMemberSettings.personalProjectsActive,
          hasDefaultProjects:
            newMemberSettings.activeDefaultProjectIds.length > 0,
        })
        .map((role) => ({
          value: role.role,
          label: role.label,
          description: role.description,
        }))
    : roles.map((role) => ({
        value: role.name,
        label: role.name,
        description: roleCopy.projectRoleSummary({
          name: role.name,
          permissions: role.permissions,
        }),
      }));

  const selectedRole = options.find((r) => r.value === value);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={selectDisabled}
    >
      <SelectTrigger className="w-full">
        {showProjectSpinner ? (
          <span className="flex items-center gap-2 font-normal text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {projectRoleAssigning ? t('Saving...') : t('Loading...')}
          </span>
        ) : selectedRole ? (
          <span className="font-normal">{selectedRole.label}</span>
        ) : (
          <SelectValue placeholder={placeholder || t('Select Role')} />
        )}
      </SelectTrigger>
      <SelectContent
        className={cn({ 'w-(--radix-select-trigger-width)': isPlatform })}
      >
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="py-3"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{t(option.label)}</span>
                <span className="text-xs whitespace-normal text-muted-foreground">
                  {t(option.description)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
