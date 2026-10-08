import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	createTrigger,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { songupAuth } from '../common/auth';
import { songSample, songupApiCall, SongUpSong } from '../common/client';
import { songOutputSchema } from '../common/output-schema';

const polling: Polling<AppConnectionValueForAuthProperty<typeof songupAuth>, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const response = await songupApiCall<{ songs: SongUpSong[] }>({
			apiKey: auth.secret_text,
			method: HttpMethod.GET,
			path: '/songs',
			query: {
				status: 'completed',
				limit: 50,
				since: lastFetchEpochMS === 0 ? undefined : lastFetchEpochMS,
			},
		});
		return response.songs.map((song) => ({
			epochMilliSeconds: new Date(song.completed_at ?? song.created_at).getTime(),
			data: song,
		}));
	},
};

export const songFinishedTrigger = createTrigger({
	auth: songupAuth,
	name: 'song_finished',
	classification: 'READ',
	displayName: 'Song Finished',
	description:
		'Triggers when a song in your SongUp AI account is finished and ready to play, including songs made with Create Song.',
	aiMetadata: {
		description:
			'Fires once for each song in the SongUp AI account that finishes and gets an MP3, including songs made on songupai.com and with Create Song. Polls the songs finished since the last check and emits each with its audio_url, song page link, title, language and lyrics.',
	},
	type: TriggerStrategy.POLLING,
	props: {},
	outputSchema: songOutputSchema,
	sampleData: songSample,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
