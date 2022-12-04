import { createAction, props } from '@ngrx/store';
import { Collection } from '../../../common-layout/model/piece.interface';
import { Config } from '../../../common-layout/model/fields/variable/config';
import { UUID } from 'angular2-uuid';

export enum CollectionActionType {
	CHANGE_NAME = '[PIECE] CHANGE_NAME',
	SET_INITIAL = '[PIECE] SET_INITIAL',
	UPDATE_CONFIG = '[PIECE] UPDATE_CONFIG',
	ADD_CONFIG = '[PIECE] ADD_CONFIG',
	DELETE_CONFIG = '[PIECE] DELETE_CONFIG',
	DELETE_CONFIG_FAILED = '[PIECE] DELETE_CONFIG_FAILED',
	DELETE_CONFIG_SUCCEEDED = '[PIECE] DELETE_CONFIG_SUCCEEDED',
	UPDATE_SETTINGS = '[PIECE] UPDATE_SETTINGS',
	PIECE_SAVED_SUCCESS = '[PIECE] SAVED_SUCCESS',
	PIECE_SAVED_FAILED = '[PIECE] SAVED_FAILED',
	PUBLISH_COLLECTION = '[PIECE] PUBLISH_COLLECTION',
	PUBLISH_COLLECTION_SUCCESS = '[PIECE] PUBLISH_COLLECTION_SUCCESS',
	PUBLISH_COLLECTION_FAILED = '[PIECE] PUBLISH_COLLECTION_FAILED',
}

export const CollectionModifyingState = [
	CollectionActionType.CHANGE_NAME,
	CollectionActionType.UPDATE_CONFIG,
	CollectionActionType.ADD_CONFIG,
	CollectionActionType.DELETE_CONFIG_SUCCEEDED,
	CollectionActionType.UPDATE_SETTINGS,
];

export const changeName = createAction(CollectionActionType.CHANGE_NAME, props<{ displayName: string }>());

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

export const updateSettings = createAction(
	CollectionActionType.UPDATE_SETTINGS,
	props<{
		logoFile: File | undefined;
		logoEncodedUrl: string | undefined;
		description: string;
	}>()
);

export const savedSuccess = createAction(CollectionActionType.PIECE_SAVED_SUCCESS, props<{ collection: Collection }>());

export const savedFailed = createAction(CollectionActionType.PIECE_SAVED_FAILED, props<{ error: any }>());

export const setInitial = createAction(CollectionActionType.SET_INITIAL, props<{ collection: Collection }>());

export const publishCollection = createAction(
	CollectionActionType.PUBLISH_COLLECTION,
	props<{ environmentIds: UUID[]; collection: Collection }>()
);

export const publishCollectionSuccess = createAction(
	CollectionActionType.PUBLISH_COLLECTION_SUCCESS,
	props<{ environmentIds: UUID[]; collection: Collection }>()
);

export const publishCollectionFailed = createAction(
	CollectionActionType.PUBLISH_COLLECTION_FAILED,
	props<{ error: Error }>()
);

export const PieceAction = {
	changeName,
	setInitial,
	updateConfig,
	addConfig,
	deleteConfigSucceeded,
	updateSettings,
	savedSuccess,
	savedFailed,
	publishCollection,
	publishCollectionSuccess,
	deleteConfigFailed,
	deleteConfig,
	publishCollectionFailed,
};
