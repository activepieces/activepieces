import { createAction, props } from '@ngrx/store';
import { ApiKey } from '../../../common-layout/model/api-key.interface';
import { UUID } from 'angular2-uuid';
import { SeekPage } from '../../../common-layout/service/seek-page';

enum ApiKeysActionType {
	LOAD_API_KEYS_STARTED = '[API_KEYS] LOAD_API_KEYS_STARTED',
	LOAD_API_KEYS_FINISHED = '[API_KEYS] LOAD_API_KEYS_FINISHED',
	CREATE_API_KEY = '[API_KEYS] CREATE_API_KES ',
	CREATE_API_KEY_SUCCESS = '[API_KEYS] CREATE_API_KEY_SUCCESS ',
	CREATE_API_KEY_FAILED = '[API_KEYS] CREATE_API_KEY_FAILED',
	DELETE_API_KEY = '[API_KEYS] DELETE_API_KEY',
}

export const loadApiKeys = createAction(ApiKeysActionType.LOAD_API_KEYS_STARTED);

export const loadApiKeysFinished = createAction(
	ApiKeysActionType.LOAD_API_KEYS_FINISHED,
	props<{ apiKeys: SeekPage<ApiKey> }>()
);

export const createApiKey = createAction(ApiKeysActionType.CREATE_API_KEY, props<{ name: string }>());

export const createApiKeyFailed = createAction(ApiKeysActionType.CREATE_API_KEY_FAILED, props<{ error: Error }>());

export const createApiKeySuccess = createAction(ApiKeysActionType.CREATE_API_KEY_SUCCESS, props<{ apiKey: ApiKey }>());

export const deleteApiKey = createAction(
	ApiKeysActionType.DELETE_API_KEY,
	props<{
		id: UUID;
	}>()
);

export const ApiKeysActions = {
	createApiKey,
	createApiKeySuccess,
	createApiKeyFailed,
	loadApiKeys,
	loadApiKeysFinished,
	deleteApiKey,
};
