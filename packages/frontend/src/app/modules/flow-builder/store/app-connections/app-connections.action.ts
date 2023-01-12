import { createAction, props } from '@ngrx/store';
import { AppConnection } from 'shared';

export enum AppConectionActionType {
	LOAD_INITIAL = '[APP_CONNECTION] LOAD_INITIAL',
	UPSERT = '[APP_CONNECTION] UPSERT_APP_CONNECTION',
	DELETE = '[APP_CONNECTION] DELETE_APP_CONNECTION',
}

const upsert = createAction(AppConectionActionType.UPSERT, props<{ connection: AppConnection }>());

export const appConnectionsActions = {
	upsert,
};
