import { ApiKey } from '../../../common-layout/model/api-key.interface';
import { createReducer, on } from '@ngrx/store';
import { ApiKeysActions } from '../action/api-keys.action';
import { SeekPage } from '../../../common-layout/service/seek-page';
import { UUID } from 'angular2-uuid';

export declare type ApiKeysState = {
	apiKeys: SeekPage<ApiKey> | null;
	loaded: boolean;
};

const initialState: ApiKeysState = {
	apiKeys: null,
	loaded: false,
};

export const apiKeysReducer = createReducer(
	initialState,
	on(ApiKeysActions.loadApiKeysFinished, (state, { apiKeys }: { apiKeys: SeekPage<ApiKey> }): ApiKeysState => {
		return { apiKeys: apiKeys, loaded: true };
	}),
	on(ApiKeysActions.loadApiKeys, (): ApiKeysState => {
		return { apiKeys: null, loaded: false };
	}),
	on(ApiKeysActions.deleteApiKey, (state, { id }: { id: UUID }): ApiKeysState => {
		const apiKeys: SeekPage<ApiKey> = JSON.parse(JSON.stringify(state.apiKeys));
		const index = apiKeys.data.findIndex(f => f.id === id);
		if (index != -1) {
			apiKeys.data.splice(index, 1);
		}
		return { ...state, apiKeys };
	}),
	on(ApiKeysActions.createApiKeySuccess, (state, action): ApiKeysState => {
		const apiKeys: SeekPage<ApiKey> = JSON.parse(JSON.stringify(state.apiKeys));
		apiKeys.data.push(action.apiKey);
		return { ...state, loaded: true, apiKeys };
	}),
	on(ApiKeysActions.createApiKeyFailed, (state, action): ApiKeysState => {
		return { ...state, loaded: true };
	})
);
