import { createAction, props } from "@ngrx/store";
import { AppCredentialId, Project, UpsertAppCredentialsRequest } from "shared";

export enum AppCredentialActionType {
	LOAD_INITIAL = '[APP_CREDENTIAL] LOAD_INITIAL',
	UPSERT = '[APP_CREDENTIAL] UPSERT_APP_CONNECTION',
	DELETE = '[APP_CREDENTIAL] DELETE_APP_CONNECTION'
}

export const loadInitial = createAction(AppCredentialActionType.LOAD_INITIAL, props<{ project: Project }>());

export const upsert = createAction(AppCredentialActionType.UPSERT, props<{ request: UpsertAppCredentialsRequest }>());

export const deleteCredential = createAction(AppCredentialActionType.DELETE, props<{ id: AppCredentialId }>());