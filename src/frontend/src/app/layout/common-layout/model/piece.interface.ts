import { UUID } from 'angular2-uuid';
import { VersionEditState } from './enum/version-edit-state.enum';
import { Observable } from 'rxjs';
import { Config } from './fields/variable/config';

export interface Collection {
	id: UUID;
	name: string;
	projectId: string;
	lastVersion: CollectionVersion;
	versionsList: UUID[];
	epochCreationTime: number;
	epochUpdateTime: number;
	flowCount?: Observable<number>;
}

export interface CollectionVersion {
	id: UUID;
	displayName: string;
	state: VersionEditState;
	configs: Config[];
	// Locally uploaded file
	logoUrl: string;
	access: string;
	description: string;
	flowsVersionId: UUID[];
	epochCreationTime: number;
	epochUpdateTime: number;
}
