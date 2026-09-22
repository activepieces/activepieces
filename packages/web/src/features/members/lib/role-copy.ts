import { ProjectRole, RoleType } from '@activepieces/core-utils';
import { DefaultProjectRole, PlatformRole } from '@activepieces/shared';
import { t } from 'i18next';

const BUILT_IN_ORDER: string[] = [
  DefaultProjectRole.ADMIN,
  DefaultProjectRole.EDITOR,
  DefaultProjectRole.VIEWER,
];

function projectRoleDescription(roleName: string): string | null {
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

function projectRoleTone(roleName: string): RoleTone {
  switch (roleName) {
    case DefaultProjectRole.ADMIN:
      return 'brand';
    case DefaultProjectRole.EDITOR:
      return 'info';
    case DefaultProjectRole.VIEWER:
      return 'neutral';
    default:
      return 'custom';
  }
}

function platformRoles({
  personalProjectsEnabled,
}: PlatformRolesParams): PlatformRoleSummary[] {
  return [
    {
      role: PlatformRole.ADMIN,
      tone: 'brand',
      label: t('Admin'),
      description: t('Full access to all projects and platform settings'),
      isDefaultForNewMembers: false,
    },
    {
      role: PlatformRole.OPERATOR,
      tone: 'info',
      label: t('Operator'),
      description: t(
        'Access and edit flows in all projects, no platform settings',
      ),
      isDefaultForNewMembers: false,
    },
    {
      role: PlatformRole.MEMBER,
      tone: 'neutral',
      label: t('Member'),
      description: personalProjectsEnabled
        ? t(
            "Access to personal project and any team projects they're invited to",
          )
        : t("Access to the team projects they're invited to"),
      isDefaultForNewMembers: true,
    },
  ];
}

function sortProjectRoles({ roles }: { roles: ProjectRole[] }): ProjectRole[] {
  return [...roles].sort((left, right) => {
    const leftRank = builtInRank(left);
    const rightRank = builtInRank(right);
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }
    return left.name.localeCompare(right.name);
  });
}

function builtInRank(role: ProjectRole): number {
  if (role.type !== RoleType.DEFAULT) {
    return BUILT_IN_ORDER.length;
  }
  const index = BUILT_IN_ORDER.indexOf(role.name);
  return index === -1 ? BUILT_IN_ORDER.length - 1 : index;
}

export const roleCopy = {
  projectRoleDescription,
  projectRoleTone,
  platformRoles,
  sortProjectRoles,
};

export type RoleTone = 'brand' | 'info' | 'neutral' | 'custom';

export type PlatformRoleSummary = {
  role: PlatformRole;
  tone: RoleTone;
  label: string;
  description: string;
  isDefaultForNewMembers: boolean;
};

type PlatformRolesParams = {
  personalProjectsEnabled: boolean;
};
