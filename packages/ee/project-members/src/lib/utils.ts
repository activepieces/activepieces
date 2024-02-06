import { ProjectMemberRole } from '@activepieces/shared';

export const RolesDisplayNames: { [k: string]: string } = {
  [ProjectMemberRole.ADMIN]: $localize`Admin`,
  [ProjectMemberRole.EDITOR]: $localize`Editor`,
  [ProjectMemberRole.VIEWER]: $localize`Viewer`,
};
