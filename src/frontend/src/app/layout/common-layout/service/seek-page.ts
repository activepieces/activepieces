import { UUID } from 'angular2-uuid';

export interface SeekPage<T> {
	hasMore: boolean;
	startingAfter?: UUID;
	endingBefore?: UUID;
	data: T[];
}
