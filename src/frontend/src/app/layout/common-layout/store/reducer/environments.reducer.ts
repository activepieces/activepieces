import { Action, createReducer, on } from '@ngrx/store';
import { EnvironmentsState } from '../model/environments.model';
import { EnvironmentActions } from '../action/environment.action';
import { ProjectEnvironment } from '../../model/project-environment.interface';
import { PieceAction } from 'src/app/layout/flow-builder/store/action/piece.action';

const initialState: EnvironmentsState = {
	loaded: false,
	environments: [],
};

const _environmentReducer = createReducer(
	initialState,
	on(EnvironmentActions.setEnvironments, (state, { environments }): EnvironmentsState => {
		return { loaded: true, environments: environments };
	}),
	on(EnvironmentActions.clearEnvironments, (state, {}): EnvironmentsState => {
		return { loaded: false, environments: [] };
	}),
	on(EnvironmentActions.addEnvironment, (state, { environment }): EnvironmentsState => {
		const clonedState: EnvironmentsState = JSON.parse(JSON.stringify(state));
		clonedState.environments.push(environment);
		return { loaded: true, environments: clonedState.environments };
	}),
	on(PieceAction.publishCollectionSuccess, (state, { environmentIds, collection }): EnvironmentsState => {
		const environments: ProjectEnvironment[] = JSON.parse(JSON.stringify(state.environments));
		environmentIds.forEach(environmentId => {
			const environment: ProjectEnvironment | undefined = environments.find(env => env.id === environmentId);
			if (environment !== undefined) {
				environment.deployedCollections = environment.deployedCollections.filter(
					dc => dc.collectionId !== collection.id
				);
				environment.deployedCollections.push({
					collectionId: collection.id,
					collectionVersionsId: [collection.lastVersion.id],
				});
			}
		});
		return { loaded: true, environments: environments };
	})
);

export function environmentReducer(state: EnvironmentsState | undefined, action: Action) {
	return _environmentReducer(state, action);
}
