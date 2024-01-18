import { createSelector } from '@ngrx/store';
import { CommonStateModel, ProjectsState } from '../common-state.model';
import { selectCommonState } from '../common.selector';
import { NotificationStatus } from '@activepieces/shared';

const selectProjectState = createSelector(
  selectCommonState,
  (state: CommonStateModel): ProjectsState => state.projectsState
);

const selectAllProjects = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.projects;
  }
);

const selectCurrentProject = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.projects[state.selectedIndex];
  }
);

const selectIsNotificationsEnabled = createSelector(
  selectCurrentProject,
  (project) => {
    return project.notifyStatus === NotificationStatus.ALWAYS;
  }
);

const selectCurrentProjectOwnerId = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.projects[state.selectedIndex]?.ownerId;
  }
);

export const ProjectSelectors = {
  selectCurrentProjectOwnerId,
  selectIsNotificationsEnabled,
  selectAllProjects,
  selectCurrentProject,
};
