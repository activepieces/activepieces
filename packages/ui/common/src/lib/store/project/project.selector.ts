import { createSelector } from '@ngrx/store';
import { CommonStateModel, ProjectsState } from '../common-state.model';
import { selectCommonState } from '../common.selector';
import { NotificationStatus } from '@activepieces/shared';

const selectProjectState = createSelector(
  selectCommonState,
  (state: CommonStateModel): ProjectsState => state.projectsState
);

const selectProject = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.projects[state.selectedIndex];
  }
);

const selectAllProjects = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.projects;
  }
);

const selectIsNotificationsEnabled = createSelector(
  selectProject,
  (project) => {
    return project.notifyStatus === NotificationStatus.ALWAYS;
  }
);

export const ProjectSelectors = {
  selectProject,
  selectIsNotificationsEnabled,
  selectAllProjects,
};
