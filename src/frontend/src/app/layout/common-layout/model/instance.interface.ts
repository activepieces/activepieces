import { UUID } from 'angular2-uuid';
import { InstanceStatus } from './enum/instance-status';

export interface Instance {
	id: UUID;
	accountId: UUID;
	collectionVersionId: UUID;
	variables: any;
	status: InstanceStatus;
	epochCreationTime: number;
	epochUpdateTime: number;

	// Optional
	runs?: number;
	accountDisplayName?: string;
	pieceDisplayName?: string;
}
