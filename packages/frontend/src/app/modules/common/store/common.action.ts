import { createAction, props } from '@ngrx/store';
import { User } from '@activepieces/shared';

export enum CommonActionType {
	LOAD_INITIAL = '[APP_STATE] LOAD_INITIAL',
	CLEAR_STATE = '[APP_STATE] CLEAR_STATE',
}

export const loadInitial = createAction(CommonActionType.LOAD_INITIAL, props<{ user: User }>());
export const clearState = createAction(CommonActionType.CLEAR_STATE);

export const CommonActions = {
	loadInitial,
	clearState,
};
