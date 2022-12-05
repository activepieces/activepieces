import { createAction, props } from '@ngrx/store';
import { Organization } from '../../model/organisation.interface';

export enum OrganizationsActionType {
	SET_ORGANIZATIONS = '[ORGANIZATION] SET_ORGANIZATIONS',
	CLEAR_ORGANIZATIONS = '[ORGANIZATION] CLEAR_ORGANIZATIONS',
}

export const clearOrganizations = createAction(OrganizationsActionType.CLEAR_ORGANIZATIONS);

export const setOrganizations = createAction(
	OrganizationsActionType.SET_ORGANIZATIONS,
	props<{ organizations: Organization[] }>()
);

export const OrganizationActions = {
	setOrganizations,
	clearOrganizations,
};
