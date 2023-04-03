import { createSelector } from '@ngrx/store';
import { CommonStateModel, ProjectsState } from '../common-state.model';
import { selectCommonState } from '../common.selector';

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

export const ProjectSelectors = {
  selectProject,
};
