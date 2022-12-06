import { FlowVersion } from './flow-version.class';
import { UUID } from 'angular2-uuid';

export class Flow {
	id: UUID;
	collection_id: string;
	created: number;
	updated: number;
	last_version: FlowVersion;
}
