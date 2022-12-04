import { createAction, props } from '@ngrx/store';
import { ProjectEnvironment } from '../../model/project-environment.interface';

export enum EnvironmentActionType {
	SET_ENVIRONMENTS = '[ENVIRONMENT] SET_ENVIRONMENTS',
	ADD_ENVIRONMENT = '[ENVIRONMENT] ADD_ENVIRONMENT',
	CLEAR_ENVIRONMENTS = '[ENVIRONMENT] CLEAR_ENVIRONMENTS',
}

export const clearEnvironments = createAction(EnvironmentActionType.CLEAR_ENVIRONMENTS);

export const setEnvironments = createAction(
	EnvironmentActionType.SET_ENVIRONMENTS,
	props<{ environments: ProjectEnvironment[] }>()
);

export const addEnvironment = createAction(
	EnvironmentActionType.ADD_ENVIRONMENT,
	props<{ environment: ProjectEnvironment }>()
);

export const EnvironmentActions = {
	setEnvironments,
	addEnvironment,
	clearEnvironments,
};
