import { Platform, ProjectWithLimits } from '@activepieces/shared';

export interface ProjectsState {
  selectedIndex: number;
  projects: ProjectWithLimits[];
  platform?: Platform;
}
