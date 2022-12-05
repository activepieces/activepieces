import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from '../../dashboard-layout.module';

const selectDashboardState = createFeatureSelector<State>('dashboard');
const selectAll = createSelector(selectDashboardState, state => state.apiKeys);

export const selectApiKeys = createSelector(selectAll, state => state.apiKeys);

export const selectApiKeysLoaded = createSelector(selectAll, state => state.loaded);

export const ApiKeysSelector = {
	selectApiKeysLoaded,
	selectApiKeys,
};
