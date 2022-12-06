// // import the interface

import { collectionActions } from '../action/collection.action';
import { UUID } from 'angular2-uuid';
import { Action, createReducer, on } from '@ngrx/store';
import { VersionEditState } from '../../../common-layout/model/enum/version-edit-state.enum';
import { CollectionStateEnum } from '../model/enums/collection-state.enum';
import { CollectionState } from '../model/collection-state.model';
import { Collection } from 'src/app/layout/common-layout/model/collection.interface';

const initialState: CollectionState = {
	state: CollectionStateEnum.INITIALIZED,
	collection: {
		last_version: {
			id: UUID,
			display_name: 'dummy',
			state: VersionEditState.DRAFT,
			configs: [],
			flowsVersionId: [],
			created: 0,
			updated: 0,
		},
		created: 0,
		updated: 0,
		id: UUID.UUID(),
		name: 'dummy',
		project_id: 'dummy',
		versionsList: [],
	},
};
const _pieceReducer = createReducer(
	initialState,
	on(collectionActions.setInitial, (state, { collection }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(collection));
		return { collection: clonedPiece, state: CollectionStateEnum.INITIALIZED };
	}),
	on(collectionActions.changeName, (state, { displayName }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.display_name = displayName;
		clonedState.state = CollectionStateEnum.SAVING;
		return clonedState;
	}),
	on(collectionActions.savedSuccess, (state, { collection }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(collection));
		return { collection: clonedPiece, state: CollectionStateEnum.SAVED };
	}),
	on(collectionActions.savedFailed, (state, { error }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(state.collection));
		console.error(error);
		return { collection: clonedPiece, state: CollectionStateEnum.FAILED };
	}),

	on(collectionActions.addConfig, (state, { config }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.configs.push(config);
		clonedState.state = CollectionStateEnum.SAVING;
		return clonedState;
	}),
	on(collectionActions.deleteConfigSucceeded, (state, { configIndex: index }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.configs.splice(index, 1);
		clonedState.state = CollectionStateEnum.SAVING;
		return clonedState;
	}),
	on(collectionActions.updateConfig, (state, { configIndex, config }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.last_version.configs[configIndex] = config;
		clonedState.state = CollectionStateEnum.SAVING;
		return clonedState;
	})
);

export function pieceReducer(state: CollectionState | undefined, action: Action) {
	return _pieceReducer(state, action);
}
