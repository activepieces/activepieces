import { Action, createReducer, on } from '@ngrx/store';
import { OrganizationActions } from '../action/organizations.action';
import { OrganizationsState } from '../model/organizations-state.model';

const initialState: OrganizationsState = {
	loaded: false,
	selectedIndex: 0,
	organizations: [],
};

const _organizationReducer = createReducer(
	initialState,
	on(OrganizationActions.setOrganizations, (state, { organizations }): OrganizationsState => {
		return { organizations: organizations, loaded: true, selectedIndex: organizations.length > 0 ? 0 : undefined };
	}),
	on(OrganizationActions.clearOrganizations, (state, {}): OrganizationsState => {
		return { organizations: [], loaded: false, selectedIndex: undefined };
	})
);

export function organizationReducer(state: OrganizationsState | undefined, action: Action) {
	return _organizationReducer(state, action);
}
