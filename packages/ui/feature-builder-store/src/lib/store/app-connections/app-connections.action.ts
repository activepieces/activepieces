import { createAction, props } from '@ngrx/store';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';

export enum AppConnectionActionType {
  LOAD_INITIAL = '[APP_CONNECTION] LOAD_INITIAL',
  UPSERT = '[APP_CONNECTION] UPSERT_APP_CONNECTION',
  DELETE = '[APP_CONNECTION] DELETE_APP_CONNECTION',
}

const upsert = createAction(
  AppConnectionActionType.UPSERT,
  props<{ connection: AppConnectionWithoutSensitiveData }>()
);
const loadInitial = createAction(
  AppConnectionActionType.LOAD_INITIAL,
  props<{ connections: AppConnectionWithoutSensitiveData[] }>()
);

export const appConnectionsActions = {
  upsert,
  loadInitial,
};
