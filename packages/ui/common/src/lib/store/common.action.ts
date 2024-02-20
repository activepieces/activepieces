import { createAction } from '@ngrx/store';

export enum CommonActionType {
  CLEAR_STATE = '[APP_STATE] CLEAR_STATE',
}

export const clearState = createAction(CommonActionType.CLEAR_STATE);

export const CommonActions = {
  clearState,
};
