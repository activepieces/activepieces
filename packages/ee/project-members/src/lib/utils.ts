import { ProjectMemberRole } from '@activepieces/ee-shared';

export const RolesDisplayNames: { [k: string]: string } = {
  [ProjectMemberRole.ADMIN]: $localize`Admin`,
  [ProjectMemberRole.EDITOR]: $localize`Editor`,
  [ProjectMemberRole.VIEWER]: $localize`Viewer`,
};
