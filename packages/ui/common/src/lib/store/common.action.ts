import { createAction, props } from '@ngrx/store';
import { ProjectId } from '@activepieces/shared';
import { UserWithoutPassword } from '@activepieces/shared';

export enum CommonActionType {
  LOAD_INITIAL = '[APP_STATE] LOAD_INITIAL',
  CLEAR_STATE = '[APP_STATE] CLEAR_STATE',
}

export const loadProjects = createAction(
  CommonActionType.LOAD_INITIAL,
  props<{ user: UserWithoutPassword; currentProjectId: ProjectId }>()
);
export const clearState = createAction(CommonActionType.CLEAR_STATE);

export const CommonActions = {
  loadProjects,
  clearState,
};
