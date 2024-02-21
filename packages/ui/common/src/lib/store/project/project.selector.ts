import { createSelector } from '@ngrx/store';
import { CommonStateModel } from '../common-state.model';
import { selectCommonState } from '../common.selector';
import { NotificationStatus } from '@activepieces/shared';
import { ProjectsState } from './project-state.model';

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

const selectPlatform = createSelector(
  selectProjectState,
  (state: ProjectsState) => {
    return state.platform;
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
  selectPlatform,
  selectAllProjects,
  selectCurrentProject,
};
