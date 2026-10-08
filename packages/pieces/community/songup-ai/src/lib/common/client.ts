import { httpClient, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const SONGUP_API_URL = 'https://www.songupai.com/api/v1';

export async function songupApiCall<T>({
	apiKey,
	method,
	path,
	query,
	body,
}: {
	apiKey: string;
	method: HttpMethod;
	path: string;
	query?: Record<string, string | number | undefined>;
	body?: Record<string, unknown>;
}): Promise<T> {
	const queryParams: QueryParams = {};
	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined && value !== '') queryParams[key] = String(value);
	}
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${SONGUP_API_URL}${path}`,
		headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
		queryParams,
		body,
	});
	return response.body;
}

export type SongUpSong = {
	id: string;
	title: string | null;
	status: 'pending' | 'processing' | 'completed' | 'failed';
	audio_url: string | null;
	song_url: string;
	language: string | null;
	music_type: string | null;
	style: string | null;
	lyrics: string | null;
	duration_seconds: number | null;
	catalog_match: boolean;
	error: string | null;
	created_at: string;
	completed_at: string | null;
};

export const MUSIC_TYPES = [
	'Full Vocal Song',
	'Only Vocals',
	'Nursery Rhymes',
	'Instrumental Beat',
	'Lo-Fi Beats',
	'Cinematic Score',
	'Brand Intro',
	'Short Jingle',
];

export const songSample: SongUpSong = {
	id: '6f1c2a9e-3b7d-4c1e-9a52-8d0f4e6b1a23',
	title: 'Happy Birthday Sara',
	status: 'completed',
	audio_url:
		'https://pub-7e77fd3cab594f41a87065e66fe60fbb.r2.dev/songs/6f1c2a9e-3b7d-4c1e-9a52-8d0f4e6b1a23.mp3',
	song_url: 'https://www.songupai.com/song/6f1c2a9e-3b7d-4c1e-9a52-8d0f4e6b1a23',
	language: 'English',
	music_type: 'Full Vocal Song',
	style: 'Pop',
	lyrics: null,
	duration_seconds: 128,
	catalog_match: false,
	error: null,
	created_at: '2026-10-06T10:00:00.000Z',
	completed_at: '2026-10-06T10:01:05.000Z',
};
