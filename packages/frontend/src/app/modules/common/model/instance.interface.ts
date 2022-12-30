import { UUID } from 'angular2-uuid';
import { InstanceStatus } from './enum/instance-status';

export interface Instance {
	id: UUID;
	collection_version_id: UUID;
	status: InstanceStatus;
	created: number;
	updated: number;
}
