import { ProjectsState } from './projects-state.model';
import { OrganizationsState } from './organizations-state.model';
import { EventsState } from './events-state.model';
import { EnvironmentsState } from './environments.model';

export interface CommonStateModel {
	readonly eventsState: EventsState;
	readonly organizationsState: OrganizationsState;
	readonly projectsState: ProjectsState;
	readonly environmentsState: EnvironmentsState;
}
