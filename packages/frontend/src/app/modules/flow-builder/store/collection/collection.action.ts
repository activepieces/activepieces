import { createAction, props } from '@ngrx/store';
import { Collection, Instance } from '@activepieces/shared';
export enum CollectionActionType {
  CHANGE_NAME = '[COLLECTION] CHANGE_NAME',
  SET_INITIAL = '[COLLECTION] SET_INITIAL',
  COLLECTION_SAVED_SUCCESS = '[COLLECTION] SAVED_SUCCESS',
  COLLECTION_SAVED_FAILED = '[COLLECTION] SAVED_FAILED',
  PUBLISH_COLLECTION = '[COLLECTION] PUBLISH_COLLECTION',
  PUBLISH_COLLECTION_FAILED = '[COLLECTION] PUBLISH_COLLECTION_FAILED',
  PUBLISH_COLLECTION_SUCCESS = '[COLLECTION] PUBLISH_COLLECTION_SUCCESS',
  DISABLE_INSTANCE = '[COLLECTION] DISABLE_INSTANCE',
  ENABLE_INSTANCE = `[COLLECTION] ENABLE_INSTANCE`,
}

export const CollectionModifyingState = [CollectionActionType.CHANGE_NAME];

export const changeName = createAction(
  CollectionActionType.CHANGE_NAME,
  props<{ displayName: string }>()
);

export const changeDescription = createAction(
  CollectionActionType.CHANGE_NAME,
  props<{ description: string }>()
);

export const savedSuccess = createAction(
  CollectionActionType.COLLECTION_SAVED_SUCCESS,
  props<{ collection: Collection }>()
);
export const enableInstance = createAction(
  CollectionActionType.ENABLE_INSTANCE
);
export const disableInstance = createAction(
  CollectionActionType.DISABLE_INSTANCE
);
export const publish = createAction(CollectionActionType.PUBLISH_COLLECTION);
export const publishFailed = createAction(
  CollectionActionType.PUBLISH_COLLECTION_FAILED
);
export const publishSuccess = createAction(
  CollectionActionType.PUBLISH_COLLECTION_SUCCESS,
  props<{ instance: Instance; showSnackbar: boolean }>()
);
export const savedFailed = createAction(
  CollectionActionType.COLLECTION_SAVED_FAILED,
  props<{ error: any }>()
);

export const setInitial = createAction(
  CollectionActionType.SET_INITIAL,
  props<{ collection: Collection; instance?: Instance }>()
);

export const CollectionActions = {
  changeName,
  setInitial,
  savedSuccess,
  savedFailed,
  publish,
  publishSuccess,
  publishFailed,
  enableInstance,
  disableInstance,
};
