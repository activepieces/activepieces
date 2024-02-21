import { Platform } from '@activepieces/ee-shared';
import { Project } from '@activepieces/shared';

export interface CommonStateModel {
  readonly projectsState: ProjectsState;
}

export interface ProjectsState {
  selectedIndex: number;
  projects: Project[];
  platform?: Platform;
}
