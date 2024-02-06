import { Platform } from '@activepieces/shared';
import { Project } from '@activepieces/shared';

export interface CommonStateModel {
  readonly projectsState: ProjectsState;
}

export interface ProjectsState {
  loaded: boolean;
  selectedIndex: number;
  projects: Project[];
  platform?: Platform;
}
