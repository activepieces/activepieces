import { DefaultProjectRole, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';

function builtInProjectRoleDescription(roleName: string): string | null {
  switch (roleName) {
    case DefaultProjectRole.ADMIN:
      return t('Full access');
    case DefaultProjectRole.EDITOR:
      return t('Builds and runs flows');
    case DefaultProjectRole.VIEWER:
      return t('View only');
    default:
      return null;
  }
}

function platformRoles(): PlatformRoleSummary[] {
  return [
    {
      role: PlatformRole.ADMIN,
      label: t('Admin'),
      description: t('Every project as Admin, plus this console'),
      isDefaultForNewMembers: false,
    },
    {
      role: PlatformRole.OPERATOR,
      label: t('Operator'),
      description: t('Every project as Editor, no console'),
      isDefaultForNewMembers: false,
    },
    {
      role: PlatformRole.MEMBER,
      label: t('Member'),
      description: t("Own project, plus the projects they're added to"),
      isDefaultForNewMembers: true,
    },
  ];
}

export const roleCopy = { builtInProjectRoleDescription, platformRoles };

export type PlatformRoleSummary = {
  role: PlatformRole;
  label: string;
  description: string;
  isDefaultForNewMembers: boolean;
};
