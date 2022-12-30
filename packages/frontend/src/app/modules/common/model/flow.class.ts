import { FlowVersion } from './flow-version.class';
import { UUID } from 'angular2-uuid';

export class Flow {
	id: UUID;
	collectionId: string;
	created: number;
	updated: number;
	version: FlowVersion;
}
