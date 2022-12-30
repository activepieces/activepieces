import { VersionEditState } from './enum/version-edit-state.enum';
import { Config } from './fields/variable/config';

export interface Collection {
	id: string;
	projectId: string;
	version: CollectionVersion;
	created: number;
	updated: number;
}

export interface CollectionVersion {
	id: string;
	displayName: string;
  	collectionId: string;
	state: VersionEditState;
	configs: Config[];
	created: number;
	updated: number;
}


