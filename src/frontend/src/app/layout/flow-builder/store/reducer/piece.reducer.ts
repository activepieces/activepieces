// // import the interface

import { PieceAction } from '../action/piece.action';
import { Collection } from '../../../common-layout/model/piece.interface';
import { UUID } from 'angular2-uuid';
import { Action, createReducer, on } from '@ngrx/store';
import { VersionEditState } from '../../../common-layout/model/enum/version-edit-state.enum';
import { PieceStateEnum } from '../model/enums/piece-state.enum';
import { CollectionState } from '../model/collection-state.model';

const initialState: CollectionState = {
	state: PieceStateEnum.INITIALIZED,
	collection: {
		lastVersion: {
			id: UUID,
			displayName: 'dummy',
			state: VersionEditState.DRAFT,
			configs: [],
			logoUrl: 'dummy',
			access: 'string',
			description: 'string',
			flowsVersionId: [],
			epochCreationTime: 0,
			epochUpdateTime: 0,
		},
		epochCreationTime: 0,
		epochUpdateTime: 0,
		id: UUID.UUID(),
		name: 'dummy',
		projectId: 'dummy',
		versionsList: [],
	},
};
const _pieceReducer = createReducer(
	initialState,
	on(PieceAction.setInitial, (state, { collection: piece }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(piece));
		return { collection: clonedPiece, state: PieceStateEnum.INITIALIZED };
	}),
	on(PieceAction.changeName, (state, { displayName }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.lastVersion.displayName = displayName;
		clonedState.state = PieceStateEnum.SAVING;
		return clonedState;
	}),
	on(PieceAction.savedSuccess, (state, { collection: piece }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(piece));
		return { collection: clonedPiece, state: PieceStateEnum.SAVED };
	}),
	on(PieceAction.savedFailed, (state, { error }): CollectionState => {
		const clonedPiece: Collection = JSON.parse(JSON.stringify(state.collection));
		console.error(error);
		return { collection: clonedPiece, state: PieceStateEnum.FAILED };
	}),

	on(PieceAction.addConfig, (state, { config }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.lastVersion.configs.push(config);
		clonedState.state = PieceStateEnum.SAVING;
		return clonedState;
	}),
	on(PieceAction.deleteConfigSucceeded, (state, { configIndex: index }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.lastVersion.configs.splice(index, 1);
		clonedState.state = PieceStateEnum.SAVING;
		return clonedState;
	}),
	on(PieceAction.updateConfig, (state, { configIndex, config }): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		clonedState.collection.lastVersion.configs[configIndex] = config;
		clonedState.state = PieceStateEnum.SAVING;
		return clonedState;
	}),
	on(PieceAction.updateSettings, (state, ChangeLogoProps): CollectionState => {
		const clonedState: CollectionState = JSON.parse(JSON.stringify(state));
		if (ChangeLogoProps.logoEncodedUrl != undefined) {
			clonedState.collection.lastVersion.logoUrl = ChangeLogoProps.logoEncodedUrl;
		}
		clonedState.collection.lastVersion.description = ChangeLogoProps.description;
		clonedState.state = PieceStateEnum.SAVING;
		return clonedState;
	})
);

export function pieceReducer(state: CollectionState | undefined, action: Action) {
	return _pieceReducer(state, action);
}
