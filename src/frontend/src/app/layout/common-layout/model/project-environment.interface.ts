import { UUID } from 'angular2-uuid';

export interface ProjectEnvironment {
	id: string;
	projectId: string;
	name: string;
	epochCreationTime: number;
	epochUpdateTime: number;
	//TODO please make this a single collectionVersionID.
	deployedCollections: { collectionId: UUID; collectionVersionsId: UUID[] }[];
}
