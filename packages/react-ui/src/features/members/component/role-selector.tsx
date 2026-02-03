import { t } from 'i18next';

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

type RoleConfig<T = string> = {
  value: T;
  label: string;
  description: string;
};

const PLATFORM_ROLES: RoleConfig<PlatformRole>[] = [
  {
    value: PlatformRole.ADMIN,
    label: t('Admin'),
    description: t('Full access to all projects and platform settings'),
  },
  {
    value: PlatformRole.OPERATOR,
    label: t('Operator'),
    description: t(
      'Access and edit flows in all projects, no platform settings',
    ),
  },
  {
    value: PlatformRole.MEMBER,
    label: t('Member'),
    description: t(
      "Access to personal project and any team projects they're invited to",
    ),
  },
];

const PROJECT_ROLE_DESCRIPTIONS: Record<string, string> = {
  Admin: t('Manage project settings, members, connections, and git sync'),
  Editor: t('Build, publish, and manage flows'),
  Viewer: t('View flows and monitor run history'),
};

export const getProjectRoleDescription = (roleName: string): string => {
  return PROJECT_ROLE_DESCRIPTIONS[roleName] || '';
};

interface RoleSelectorProps {
  type: 'platform' | 'project';
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  roles?: Array<{ name: string }>;
}

export const RoleSelector = ({
  type,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  roles = [],
}: RoleSelectorProps) => {
  const isPlatform = type === 'platform';

  const label = isPlatform ? t('Platform Roles') : t('Project Roles');

  const options = isPlatform
    ? PLATFORM_ROLES.map((role) => ({
        value: role.value,
        label: role.label,
        description: role.description,
      }))
    : roles.map((role) => ({
        value: role.name,
        label: role.name,
        description: getProjectRoleDescription(role.name),
      }));

  const selectedRole = options.find((r) => r.value === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-auto py-2">
        {selectedRole ? (
          <div className="flex flex-col items-start gap-0.5 text-left w-full">
            <span className="font-normal">{selectedRole.label}</span>
            <span className="text-xs text-muted-foreground font-normal whitespace-normal">
              {selectedRole.description}
            </span>
          </div>
        ) : (
          <SelectValue placeholder={placeholder || t('Select Role')} />
        )}
      </SelectTrigger>
      <SelectContent>
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
                <span className="text-xs text-muted-foreground">
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

interface RoleDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  roles: Array<{ name: string }>;
  className?: string;
}

export const RoleDropdown = ({
  value,
  onValueChange,
  disabled = false,
  roles,
  className = '',
}: RoleDropdownProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`w-[150px] justify-between ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{t('Roles')}</SelectLabel>
          {roles.map((role) => (
            <SelectItem key={role.name} value={role.name} className="py-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{role.name}</span>
                <span className="text-xs text-muted-foreground">
                  {t(getProjectRoleDescription(role.name))}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
