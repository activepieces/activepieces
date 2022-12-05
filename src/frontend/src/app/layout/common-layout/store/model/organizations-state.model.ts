import { Organization } from '../../model/organisation.interface';

export interface OrganizationsState {
	loaded: boolean;
	selectedIndex: undefined | number;
	organizations: Organization[];
}
