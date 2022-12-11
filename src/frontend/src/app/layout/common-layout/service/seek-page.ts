import { UUID } from 'angular2-uuid';

export interface SeekPage<T> {
	next?: UUID;
	previous?: UUID;
	data: T[];
}
