import { PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type RoleConfig<T = string> = {
  value: T;
  label: string;
  description: string;
  badge?: string;
};

const PLATFORM_ROLES: RoleConfig<PlatformRole>[] = [
  {
    value: PlatformRole.OPERATOR,
    label: t('Operator'),
    description: t(
      'Builds and edits flows in every project. No platform settings or people management.',
    ),
    badge: t('Most common'),
  },
  {
    value: PlatformRole.ADMIN,
    label: t('Admin'),
    description: t(
      'Full control of the workspace, all projects, and platform settings.',
    ),
  },
  {
    value: PlatformRole.MEMBER,
    label: t('Member'),
    description: t(
      'Starts with their own private project. Add them to shared projects to collaborate.',
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
  const isPlatform = type === 'platform';
  const projectRolesLoading = !isPlatform && isLoading;
  const projectRoleAssigning = !isPlatform && isAssigningRole;
  const showProjectSpinner = projectRolesLoading || projectRoleAssigning;
  const selectDisabled = disabled || showProjectSpinner;

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

interface AccessLevelCardsProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const AccessLevelCards = ({
  value,
  onValueChange,
  disabled = false,
}: AccessLevelCardsProps) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className="grid gap-2"
    >
      {PLATFORM_ROLES.map((role) => {
        const isSelected = role.value === value;
        return (
          <Label
            key={role.value}
            htmlFor={`access-${role.value}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/50',
            )}
          >
            <RadioGroupItem
              id={`access-${role.value}`}
              value={role.value}
              className="mt-0.5"
            />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t(role.label)}</span>
                {role.badge && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    {t(role.badge)}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {t(role.description)}
              </span>
            </div>
          </Label>
        );
      })}
    </RadioGroup>
  );
};

const PLATFORM_ROLE_PREVIEWS: Record<PlatformRole, string> = {
  [PlatformRole.ADMIN]: t(
    "They'll be able to manage all projects and platform settings.",
  ),
  [PlatformRole.OPERATOR]: t(
    "They'll be able to build and edit flows in all projects.",
  ),
  [PlatformRole.MEMBER]: t(
    "They'll start in their own private project. Add them to shared projects to collaborate.",
  ),
};

export const getPlatformRolePreview = (role: PlatformRole): string => {
  return PLATFORM_ROLE_PREVIEWS[role] ?? '';
};
