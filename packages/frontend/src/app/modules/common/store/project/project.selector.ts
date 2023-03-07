import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CommonStateModel, ProjectsState } from '../common-state.model';

export const COMMON_STATE = 'commonState';

export const selectCommonState =
  createFeatureSelector<CommonStateModel>(COMMON_STATE);

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
