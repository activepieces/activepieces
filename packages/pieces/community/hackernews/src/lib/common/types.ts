export type HackernewsItem = {
	id: number;
	deleted?: boolean;
	type?: 'job' | 'story' | 'comment' | 'poll' | 'pollopt';
	by?: string;
	time?: number;
	text?: string;
	dead?: boolean;
	parent?: number;
	poll?: number;
	kids?: number[];
	url?: string;
	score?: number;
	title?: string;
	parts?: number[];
	descendants?: number;
};

export type HackernewsUser = {
	id: string;
	created: number;
	karma: number;
	about?: string;
	submitted?: number[];
};

export type HackernewsUpdates = {
	items: number[];
	profiles: string[];
};

export type HackernewsStoryList = 'top' | 'new' | 'best' | 'ask' | 'show' | 'job';

export type HackernewsNormalizedItem = {
	id: number;
	type: string | null;
	title: string | null;
	url: string | null;
	text: string | null;
	author: string | null;
	score: number | null;
	comment_count: number | null;
	created_at: string | null;
	time: number | null;
	parent_id: number | null;
	poll_id: number | null;
	kid_ids: number[];
	part_ids: number[];
	dead: boolean;
	deleted: boolean;
	hn_url: string;
};

export type HackernewsNormalizedUser = {
	username: string;
	karma: number;
	about: string | null;
	created_at: string;
	created: number;
	submitted_count: number;
	recent_submission_ids: number[];
	hn_url: string;
};
