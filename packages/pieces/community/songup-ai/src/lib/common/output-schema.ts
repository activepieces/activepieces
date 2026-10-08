import { OutputSchema } from '@activepieces/pieces-framework';

export const songOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Song ID' },
		{ key: 'title', label: 'Title' },
		{ key: 'status', label: 'Status' },
		{ key: 'audio_url', label: 'Audio URL (MP3)' },
		{ key: 'song_url', label: 'Song Page URL' },
		{ key: 'language', label: 'Language' },
		{ key: 'music_type', label: 'Music Type' },
		{ key: 'style', label: 'Style' },
		{ key: 'lyrics', label: 'Lyrics' },
		{ key: 'duration_seconds', label: 'Duration (seconds)', format: 'number' },
		{ key: 'catalog_match', label: 'Library Song', format: 'boolean' },
		{ key: 'error', label: 'Error' },
		{ key: 'created_at', label: 'Created At', format: 'datetime' },
		{ key: 'completed_at', label: 'Completed At', format: 'datetime' },
	],
};
