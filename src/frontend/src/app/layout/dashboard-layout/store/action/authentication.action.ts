import { createAction, props } from '@ngrx/store';
import { ProjectAuthentication } from 'src/app/layout/common-layout/model/authentication';

enum AuthenticationActionType {
	CLEAR_STAGING_KEY_CREDENTIALS = '[AUTHENTICATION] CLEAR_STAGING_KEY_CREDENTIALS ',
	GENERATE_STAGING_KEY = '[AUTHENTICATION] GENERATE_STAGING_KEY',
	UPDATE_FIREBASE_PROJECT_ID = '[AUTHENTICATION] UPDATE_FIREBASE_PROJECT_ID',
	FETCH_AUTHENTICATION_SUCCESSFUL = '[AUTHENTICATION] FETCH_SUCCESSFUL',
	GENERATE_STAGING_KEY_SUCCESSFUL = '[AUTHENTICATION] GENERATE_STAGING_KEY_SUCCESSFUL',
	UPDATE_FIREBASE_PROJECT_ID_SUCCESSFUL = '[AUTHENTICATION] UPDATE_FIREBASE_PROJECT_ID_SUCCESSFUL',
	GENERATE_STAGING_KEY_FAILED = '[AUTHENTICATION] GENERATE_STAGING_KEY_FAILED',
	UPDATE_FIREBASE_PROJECT_ID_FAILED = '[AUTHENTICATION] UPDATE_FIREBASE_PROJECT_ID_FAILEd',
}

export const generateSigningKey = createAction(
	AuthenticationActionType.GENERATE_STAGING_KEY,
	props<{ environmentId: string }>()
);
export const updateFirebaseProjectId = createAction(
	AuthenticationActionType.UPDATE_FIREBASE_PROJECT_ID,
	props<{ environmentId: string; projectId: string }>()
);

export const fetchAuthenticationsSuccessful = createAction(
	AuthenticationActionType.FETCH_AUTHENTICATION_SUCCESSFUL,
	props<{ authentications: ProjectAuthentication[] }>()
);

export const generateSigningKeySuccessful = createAction(
	AuthenticationActionType.GENERATE_STAGING_KEY_SUCCESSFUL,
	props<{ signingKey: ProjectAuthentication }>()
);
export const updateFirebaseProjectIdSuccessful = createAction(
	AuthenticationActionType.UPDATE_FIREBASE_PROJECT_ID_SUCCESSFUL,
	props<{ project: ProjectAuthentication }>()
);

export const generateSigningKeyFailed = createAction(
	AuthenticationActionType.GENERATE_STAGING_KEY_FAILED,
	props<{ error: any }>()
);
export const updateFirebaseProjectIdFailed = createAction(
	AuthenticationActionType.UPDATE_FIREBASE_PROJECT_ID_FAILED,
	props<{ error: any }>()
);

export const clearSigningKeyCredentials = createAction(
	AuthenticationActionType.CLEAR_STAGING_KEY_CREDENTIALS,
	props<{ key: ProjectAuthentication }>()
);
