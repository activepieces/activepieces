import { createAction, props } from '@ngrx/store';
import { NotificationStatus, Project } from '@activepieces/shared';

export enum ProjectActionType {
  CLEAR_PROJECTS = '[PROJECT] CLEAR_PROJECTS',
  SET_PROJECTS = '[PROJECT] SET_PROJECTS',
  UPDATE_PROJECT = '[PROJECT] UPDATE_PROJECT',
}

export const setProjects = createAction(
  ProjectActionType.SET_PROJECTS,
  props<{ projects: Project[]; selectedIndex: number }>()
);

export const updateProject = createAction(
  ProjectActionType.UPDATE_PROJECT,
  props<{ notifyStatus: NotificationStatus }>()
);

export const clearProjects = createAction(ProjectActionType.CLEAR_PROJECTS);

export const ProjectActions = {
  setProjects,
  clearProjects,
  updateProject,
};
