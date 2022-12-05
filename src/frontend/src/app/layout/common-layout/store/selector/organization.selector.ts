import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CommonStateModel } from '../model/common-state.model';

export const COMMON_STATE = 'commonState';

export const selectCommonState = createFeatureSelector<CommonStateModel>(COMMON_STATE);

export const selectOrganizations = createSelector(
	selectCommonState,
	(state: CommonStateModel) => state.organizationsState.organizations
);

export const OrganizationSelectors = {
	selectOrganizations,
};
