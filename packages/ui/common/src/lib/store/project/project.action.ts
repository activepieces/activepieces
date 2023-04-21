import { createAction, props } from '@ngrx/store';
import { Project } from '@activepieces/shared';

export enum ProjectActionType {
  CLEAR_PROJECTS = '[PROJECT] CLEAR_PROJECTS',
  SET_PROJECTS = '[PROJECT] SET_PROJECTS',
}

export const setProjects = createAction(
  ProjectActionType.SET_PROJECTS,
  props<{ projects: Project[] }>()
);
export const clearProjects = createAction(ProjectActionType.CLEAR_PROJECTS);

export const ProjectActions = {
  setProjects,
  clearProjects,
};
