export interface SeekPage<T> {
	next: string | null;
	previous: string | null;
	data: T[];
}
