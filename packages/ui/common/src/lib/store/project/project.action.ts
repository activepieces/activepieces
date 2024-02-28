import { createAction, props } from '@ngrx/store';
import {
  NotificationStatus,
  Platform,
  Project,
  ProjectWithLimits,
} from '@activepieces/shared';

export enum ProjectActionType {
  CLEAR_PROJECTS = '[PROJECT] CLEAR_PROJECTS',
  SET_PROJECTS = '[PROJECT] SET_PROJECTS',
  UPDATE_NOTIFY_STATUS = '[PROJECT] UPDATE_NOTIFY_STATUS',
  UPDATE_PROJECT = '[PROJECT] UPDATE_PROJECT',
  ADD_PROJECT = '[PROJECT] ADD_PROJECT',
  UPDATE_LIMITS = '[PROJECT] UPDATE_LIMITS',
}

export const setProjects = createAction(
  ProjectActionType.SET_PROJECTS,
  props<{
    projects: ProjectWithLimits[];
    selectedIndex: number;
    platform: Platform | undefined;
  }>()
);

export const updateNotifyStatus = createAction(
  ProjectActionType.UPDATE_NOTIFY_STATUS,
  props<{ notifyStatus: NotificationStatus }>()
);

export const updateLimits = createAction(
  ProjectActionType.UPDATE_LIMITS,
  props<{ limits: { tasks: number } }>()
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
  updateLimits,
  addProject,
  updateProject,
};
