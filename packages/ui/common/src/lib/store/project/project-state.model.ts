import { Project } from '@activepieces/shared';
import { Platform } from '@activepieces/ee-shared';

export interface ProjectsState {
  selectedIndex: number;
  projects: Project[];
  platform?: Platform;
}
