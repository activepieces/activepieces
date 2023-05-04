import { createSelector } from '@ngrx/store';
import { CommonStateModel, ProjectsState } from '../common-state.model';
import { selectCommonState } from '../common.selector';
import { NotificationStatus } from '@activepieces/shared';

export const selectProjectState = createSelector(
  selectCommonState,
  (state: CommonStateModel): ProjectsState => state.projectsState
);

export const selectProject = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.projects[state.selectedIndex];
  }
);

export const selectIsNotificationsEnabled = createSelector(
  selectProject,
  (project) => {
    return project.notifyStatus === NotificationStatus.ALWAYS;
  }
);

export const ProjectSelectors = {
  selectProject,
  selectIsNotificationsEnabled,
};
