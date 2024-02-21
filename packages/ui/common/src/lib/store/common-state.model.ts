import { AppConnectionsState } from './app-connections/app-connections-state.model';
import { ProjectsState } from './project/project-state.model';

export interface CommonStateModel {
  readonly projectsState: ProjectsState;
  readonly appConnectionsState: AppConnectionsState;
}
