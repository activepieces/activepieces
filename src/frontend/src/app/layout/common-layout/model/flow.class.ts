import { FlowVersion } from './flow-version.class';
import { UUID } from 'angular2-uuid';

export class Flow {
	id: UUID;
	collectionId: string;
	epochCreationTime?: number;
	epochUpdateTime?: number;
	lastVersion: FlowVersion;
	versionsList: UUID[];
}
