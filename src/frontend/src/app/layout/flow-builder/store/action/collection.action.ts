import { createAction, props } from '@ngrx/store';
import { Collection } from 'src/app/layout/common-layout/model/collection.interface';
import { Instance } from 'src/app/layout/common-layout/model/instance.interface';
import { Config } from '../../../common-layout/model/fields/variable/config';
export enum CollectionActionType {
	CHANGE_NAME = '[COLLECTION] CHANGE_NAME',
	SET_INITIAL = '[COLLECTION] SET_INITIAL',
	UPDATE_CONFIG = '[COLLECTION] UPDATE_CONFIG',
	ADD_CONFIG = '[COLLECTION] ADD_CONFIG',
	DELETE_CONFIG = '[COLLECTION] DELETE_CONFIG',
	DELETE_CONFIG_FAILED = '[COLLECTION] DELETE_CONFIG_FAILED',
	DELETE_CONFIG_SUCCEEDED = '[COLLECTION] DELETE_CONFIG_SUCCEEDED',
	COLLECTION_SAVED_SUCCESS = '[COLLECTION] SAVED_SUCCESS',
	COLLECTION_SAVED_FAILED = '[COLLECTION] SAVED_FAILED',
	DEPLOY_COLLECTION = '[COLLECTION] DEPLOY_COLLECTION',
	DEPLOY_COLLECTION_FAILED = '[COLLECTION] DEPLOY_COLLECTION_FAILED',
	DEPLOY_COLLECTION_SUCCESS = '[COLLECTION] DEPLOY_COLLECTION_SUCCESS',
	REMOVE_INSTANCE = `[COLLECTION] REMOVE_INSTANCE`,
}

export const CollectionModifyingState = [
	CollectionActionType.CHANGE_NAME,
	CollectionActionType.UPDATE_CONFIG,
	CollectionActionType.ADD_CONFIG,
	CollectionActionType.DELETE_CONFIG_SUCCEEDED,
];

export const changeName = createAction(CollectionActionType.CHANGE_NAME, props<{ displayName: string }>());

export const removeInstance = createAction(CollectionActionType.REMOVE_INSTANCE);
export const changeDescription = createAction(CollectionActionType.CHANGE_NAME, props<{ description: string }>());
export const updateConfig = createAction(
	CollectionActionType.UPDATE_CONFIG,
	props<{ configIndex: number; config: Config }>()
);

export const deleteConfig = createAction(CollectionActionType.DELETE_CONFIG, props<{ configIndex: number }>());

export const addConfig = createAction(CollectionActionType.ADD_CONFIG, props<{ config: Config }>());
export const deleteConfigSucceeded = createAction(
	CollectionActionType.DELETE_CONFIG_SUCCEEDED,
	props<{ configIndex: number }>()
);

export const deleteConfigFailed = createAction(
	CollectionActionType.DELETE_CONFIG_FAILED,
	props<{ referenceKey: string; refreshedKey: string }>()
);

export const savedSuccess = createAction(
	CollectionActionType.COLLECTION_SAVED_SUCCESS,
	props<{ collection: Collection }>()
);

export const deploy = createAction(CollectionActionType.DEPLOY_COLLECTION);
export const deployFailed = createAction(CollectionActionType.DEPLOY_COLLECTION_FAILED);
export const deploySuccess = createAction(
	CollectionActionType.DEPLOY_COLLECTION_SUCCESS,
	props<{ instance: Instance }>()
);
export const savedFailed = createAction(CollectionActionType.COLLECTION_SAVED_FAILED, props<{ error: any }>());

export const setInitial = createAction(
	CollectionActionType.SET_INITIAL,
	props<{ collection: Collection; instance?: Instance }>()
);

export const CollectionActions = {
	changeName,
	setInitial,
	updateConfig,
	addConfig,
	deleteConfigSucceeded,
	savedSuccess,
	savedFailed,
	deleteConfigFailed,
	deleteConfig,
	deploy,
	deploySuccess,
	deployFailed,
	removeInstance,
};
