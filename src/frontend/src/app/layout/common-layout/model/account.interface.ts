import { UUID } from 'angular2-uuid';

export interface Account {
	id: UUID;
	name: string;
	environmentId: UUID;
	epochCreationTime: number;
	epochUpdateTime: number;
}
