import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { songupAuth } from '../common/auth';
import { MUSIC_TYPES, songupApiCall, SongUpSong } from '../common/client';
import { songOutputSchema } from '../common/output-schema';
import { languageDropdown } from '../common/props';

export const createSongAction = createAction({
	auth: songupAuth,
	name: 'create_song',
	classification: 'WRITE',
	displayName: 'Create Song',
	description: 'Starts an AI song with vocals from an idea or your own lyrics.',
	audience: 'both',
	aiMetadata: {
		description:
			'Starts a new AI song with sung vocals in one of 24 languages from a short idea (who it is for, names, occasion, mood) and optional lyrics, style, music type and title. Each call uses one song from the account, so it is not idempotent. The song comes back with status "pending" and is ready in about 1-3 minutes: use Get Song with the returned id, or the Song Finished trigger, to get the MP3 link.',
		idempotent: false,
	},
	props: {
		prompt: Property.LongText({
			displayName: 'Song Idea',
			description:
				'What the song is about: who it is for, names, the occasion, the mood or style. Up to 1,000 characters. Example: "A happy birthday song for my sister Sara, upbeat pop".',
			required: true,
		}),
		language: languageDropdown,
		music_type: Property.StaticDropdown({
			displayName: 'Music Type',
			required: false,
			defaultValue: 'Full Vocal Song',
			options: { options: MUSIC_TYPES.map((t) => ({ label: t, value: t })) },
		}),
		style: Property.ShortText({
			displayName: 'Style',
			description: 'A genre or style, for example Pop, Rock, Lo-fi or Bollywood.',
			required: false,
		}),
		lyrics: Property.LongText({
			displayName: 'Lyrics',
			description:
				'Your own words, up to 3,000 characters. Needs SongUp AI Pro once the first free songs are used. Leave empty and SongUp AI writes the words.',
			required: false,
		}),
		title: Property.ShortText({ displayName: 'Title', required: false }),
	},
	outputSchema: songOutputSchema,
	async run({ auth, propsValue }) {
		const body: Record<string, unknown> = { prompt: propsValue.prompt };
		for (const key of ['language', 'music_type', 'style', 'lyrics', 'title'] as const) {
			const value = propsValue[key];
			if (value) body[key] = value;
		}
		return await songupApiCall<SongUpSong>({
			apiKey: auth.secret_text,
			method: HttpMethod.POST,
			path: '/songs',
			body,
		});
	},
});
