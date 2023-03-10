import { CollectionActions } from './collection.action';
import { Action, createReducer, on } from '@ngrx/store';
import { CollectionStateEnum } from '../model/enums/collection-state.enum';
import { CollectionState } from '../model/collection-state.model';
import { FlowsActions } from '../flow/flows.action';
import { Collection } from '@activepieces/shared';

const initialState: CollectionState = {
  state: CollectionStateEnum.NONE,
  collection: {
    displayName: 'dummy',
    created: '',
    updated: '',
    id: '',
    projectId: 'dummy',
  },
  instance: undefined,
};
const _collectionReducer = createReducer(
  initialState,
  on(
    CollectionActions.setInitial,
    (state, { collection, instance }): CollectionState => {
      const clonedPiece: Collection = JSON.parse(JSON.stringify(collection));
      return {
        collection: clonedPiece,
        state: CollectionStateEnum.NONE,
        instance: instance,
      };
    }
  ),
  on(
    CollectionActions.changeName,
    (state, { displayName }): CollectionState => {
      const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
      clonedState.collection.displayName = displayName;
      clonedState.state |= CollectionStateEnum.SAVING_COLLECTION;
      return clonedState;
    }
  ),
  on(
    CollectionActions.savedSuccess,
    (state, { collection }): CollectionState => {
      const clonedPiece: Collection = JSON.parse(JSON.stringify(collection));
      return {
        collection: clonedPiece,
        state: CollectionStateEnum.NONE,
        instance: state.instance,
      };
    }
  ),
  on(CollectionActions.savedFailed, (state, { error }): CollectionState => {
    const clonedPiece: Collection = JSON.parse(
      JSON.stringify(state.collection)
    );
    console.error(error);
    return {
      collection: clonedPiece,
      state: CollectionStateEnum.FAILED_SAVING_OR_PUBLISHING,
    };
  }),
  on(CollectionActions.publish, (state): CollectionState => {
    return { ...state, state: CollectionStateEnum.PUBLISHING | state.state };
  }),
  on(CollectionActions.publishFailed, (state): CollectionState => {
    return { ...state, state: CollectionStateEnum.FAILED_SAVING_OR_PUBLISHING };
  }),
  on(CollectionActions.publishSuccess, (state, props): CollectionState => {
    return {
      ...state,
      state: state.state & ~CollectionStateEnum.PUBLISHING,
      instance: props.instance,
    };
  }),
  // TODO(abdulyki) add why there is flow actions inside collection reducer
  on(
    FlowsActions.applyUpdateOperation,
    (state, { flow, saveRequestId }): CollectionState => {
      const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
      return {
        ...clonedState,
        state: clonedState.state | CollectionStateEnum.SAVING_FLOW,
        lastSaveRequestId: saveRequestId,
      };
    }
  ),
  on(
    FlowsActions.deleteFlowStarted,
    (state, { flowId, saveRequestId }): CollectionState => {
      const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
      return {
        ...clonedState,
        state: clonedState.state | CollectionStateEnum.SAVING_FLOW,
        lastSaveRequestId: saveRequestId,
      };
    }
  ),
  on(FlowsActions.savedFailed, (state): CollectionState => {
    return { ...state, state: CollectionStateEnum.FAILED_SAVING_OR_PUBLISHING };
  }),
  on(
    FlowsActions.savedSuccess,
    (state, { saveRequestId, flow }): CollectionState => {
      const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
      //in case a new version was created after the former one was locked.
      const savingPublishingState =
        saveRequestId === clonedState.lastSaveRequestId
          ? clonedState.state & ~CollectionStateEnum.SAVING_FLOW
          : clonedState.state;
      return { ...clonedState, state: savingPublishingState };
    }
  ),
  on(
    FlowsActions.deleteSuccess,
    (state, { saveRequestId }): CollectionState => {
      return {
        ...state,
        state:
          state.lastSaveRequestId === saveRequestId
            ? state.state & ~CollectionStateEnum.SAVING_FLOW
            : state.state,
      };
    }
  )
);

export function collectionReducer(
  state: CollectionState | undefined,
  action: Action
) {
  return _collectionReducer(state, action);
}
