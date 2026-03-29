export interface TypefullySocialSet {
	id: string;
	name: string;
}

export interface TypefullyDraft {
	id: string;
	status: string;
	title: string | null;
	created_at: string;
	updated_at: string;
	published_at: string | null;
	scheduled_at: string | null;
	posts: TypefullyPost[];
	tags: TypefullyTag[];
	share_url: string | null;
}

export interface TypefullyPost {
	text: string;
	platforms: string[];
	media_ids: string[];
}

export interface TypefullyTag {
	id: string;
	name: string;
}

export interface TypefullyPaginatedResponse<T> {
	results: T[];
	count: number;
	limit: number;
	offset: number;
	next: string | null;
	previous: string | null;
}
