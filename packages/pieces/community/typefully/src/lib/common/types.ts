export interface TypefullySocialSet {
	id: string;
	name: string;
}

export interface TypefullyDraft {
	id: string;
	status: string;
	preview: string;
	created_at: string;
	updated_at: string;
	published_at: string | null;
	scheduled_date: string | null;
	share_url: string | null;
	private_url: string | null;
	tags: string[];
	platforms: Record<string, unknown>;
}

export interface TypefullyPaginatedResponse<T> {
	results: T[];
	count: number;
	limit: number;
	offset: number;
	next: string | null;
	previous: string | null;
}

export interface TypefullyTag {
	id: string;
	name: string;
}

export type PlatformKey = 'x' | 'linkedin' | 'threads' | 'bluesky' | 'mastodon';