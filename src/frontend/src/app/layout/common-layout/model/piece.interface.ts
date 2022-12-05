import { UUID } from 'angular2-uuid';
import { VersionEditState } from './enum/version-edit-state.enum';
import { Observable } from 'rxjs';
import { Config } from './fields/variable/config';

export interface Collection {
	id: UUID;
	name: string;
	project_id: string;
	last_version: CollectionVersion;
	versionsList: UUID[];
	created: number;
	updated: number;
	flowCount?: Observable<number>;
}

export interface CollectionVersion {
	id: UUID;
	display_name: string;
	state: VersionEditState;
	configs: Config[];
	flowsVersionId: UUID[];
	created: number;
	updated: number;
}
