import { createAction, props } from '@ngrx/store';
import { NotificationStatus, Project } from '@activepieces/shared';
import { Platform } from '@activepieces/ee-shared';

export enum ProjectActionType {
  CLEAR_PROJECTS = '[PROJECT] CLEAR_PROJECTS',
  SET_PROJECTS = '[PROJECT] SET_PROJECTS',
  UPDATE_NOTIFY_STATUS = '[PROJECT] UPDATE_NOTIFY_STATUS',
  UPDATE_PROJECT = '[PROJECT] UPDATE_PROJECT',
  ADD_PROJECT = '[PROJECT] ADD_PROJECT',
}

export const setProjects = createAction(
  ProjectActionType.SET_PROJECTS,
  props<{
    projects: Project[];
    selectedIndex: number;
    platform: Platform | undefined;
  }>()
);

export const updateNotifyStatus = createAction(
  ProjectActionType.UPDATE_NOTIFY_STATUS,
  props<{ notifyStatus: NotificationStatus }>()
);

export const clearProjects = createAction(ProjectActionType.CLEAR_PROJECTS);
export const updateProject = createAction(
  ProjectActionType.UPDATE_PROJECT,
  props<{ project: Project }>()
);
export const addProject = createAction(
  ProjectActionType.ADD_PROJECT,
  props<{ project: Project }>()
);
export const ProjectActions = {
  setProjects,
  clearProjects,
  updateNotifyStatus,
  addProject,
  updateProject,
};
