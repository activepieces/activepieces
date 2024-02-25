import { ProjectWithLimits } from '@activepieces/shared';
import { Platform } from '@activepieces/ee-shared';

export interface ProjectsState {
  selectedIndex: number;
  projects: ProjectWithLimits[];
  platform?: Platform;
}
