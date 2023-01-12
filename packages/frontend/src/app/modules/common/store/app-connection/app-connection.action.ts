import { createAction, props } from '@ngrx/store';
import { AppConnectionId, Project, UpsertConnectionRequest } from 'shared';

export enum AppConectionActionType {
	LOAD_INITIAL = '[APP_CONNECTION] LOAD_INITIAL',
	UPSERT = '[APP_CONNECTION] UPSERT_APP_CONNECTION',
	DELETE = '[APP_CONNECTION] DELETE_APP_CONNECTION',
}

export const loadInitial = createAction(AppConectionActionType.LOAD_INITIAL, props<{ project: Project }>());

export const upsert = createAction(AppConectionActionType.UPSERT, props<{ request: UpsertConnectionRequest }>());

export const deleteConnection = createAction(AppConectionActionType.DELETE, props<{ id: AppConnectionId }>());
