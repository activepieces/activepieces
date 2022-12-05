import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CommonStateModel } from '../model/common-state.model';
import { EnvironmentsState } from '../model/environments.model';

export const COMMON_STATE = 'commonState';

export const selectCommonState = createFeatureSelector<CommonStateModel>(COMMON_STATE);

export const selectEnvironmentState = createSelector(
	selectCommonState,
	(state: CommonStateModel): EnvironmentsState => state.environmentsState
);

export const selectEnvironmentsLoadState = createSelector(selectEnvironmentState, (state: EnvironmentsState) => {
	return state.loaded;
});

export const selectEnvironments = createSelector(selectEnvironmentState, (state: EnvironmentsState) => {
	return state.environments;
});

export const EnvironmentSelectors = {
	selectEnvironments,
	selectEnvironmentsLoadState,
};
