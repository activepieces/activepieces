import { VersionEditState } from './enum/version-edit-state.enum';
import { Config } from './fields/variable/config';

export interface Collection {
	id: string;
	name: string;
	project_id: string;
	last_version: CollectionVersion;
	versionsList: string[];
	created: number;
	updated: number;
}

export interface CollectionVersion {
	id: string;
	display_name: string;
	state: VersionEditState;
	configs: Config[];
	flowsVersionId: string[];
	created: number;
	updated: number;
}
