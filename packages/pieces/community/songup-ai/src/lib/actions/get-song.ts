import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { songupAuth } from '../common/auth';
import { songupApiCall, SongUpSong } from '../common/client';
import { songOutputSchema } from '../common/output-schema';

export const getSongAction = createAction({
	auth: songupAuth,
	name: 'get_song',
	classification: 'READ',
	displayName: 'Get Song',
	description: 'Gets a song by its ID, with its status and MP3 link once it is finished.',
	audience: 'both',
	aiMetadata: {
		description:
			'Reads one song from the SongUp AI account by id: status (pending, processing, completed or failed), title, language, lyrics and, once completed, the MP3 audio_url and song page link. Read-only and idempotent; use it to check a song started with Create Song.',
		idempotent: true,
	},
	props: {
		song_id: Property.ShortText({
			displayName: 'Song ID',
			description: 'The id returned by Create Song.',
			required: true,
		}),
	},
	outputSchema: songOutputSchema,
	async run({ auth, propsValue }) {
		return await songupApiCall<SongUpSong>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: `/songs/${encodeURIComponent(propsValue.song_id)}`,
		});
	},
});
