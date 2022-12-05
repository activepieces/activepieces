import { UUID } from 'angular2-uuid';

export interface ApiKey {
	id: UUID;
	name: string;
	secret: string;
	projectId: UUID;
	epochCreationTime: number;
	epochUpdateTime: number;
	epochLastActivity: number;
}
