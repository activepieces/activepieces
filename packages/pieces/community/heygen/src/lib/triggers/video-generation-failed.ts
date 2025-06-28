import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';

const TRIGGER_KEY = 'video_generation_failed_trigger';

export const videoGenerationFailedTrigger = createTrigger({
	auth: heygenAuth,
	name: 'video_generation_failed',
	displayName: 'New Avatar Video Event (Fail)',
	description: 'Triggers when a video generation process fails.',
	type: TriggerStrategy.WEBHOOK,
	props: {},

	sampleData: {
		event_type: 'avatar_video.fail',
		event_data: {
			video_id: 'abc',
			msg: 'Failed',
			callback_id: '123',
		},
	},

	async onEnable(context) {
		const webhook = (await heygenApiCall({
			apiKey: context.auth as string,
			method: HttpMethod.POST,
			resourceUri: '/webhook/endpoint.add',
			apiVersion: 'v1',
			body: {
				url: context.webhookUrl,
				events: ['avatar_video.fail'],
			},
		})) as { data: { endpoint_id: string } };

		await context.store.put<string>(TRIGGER_KEY, webhook.data.endpoint_id);
	},

	async onDisable(context) {
		const webhookId = await context.store.get<string>(TRIGGER_KEY);

		if (webhookId) {
			await heygenApiCall({
				apiKey: context.auth as string,
				method: HttpMethod.DELETE,
				resourceUri: '/webhook/endpoint.delete',
				apiVersion: 'v1',
				query: {
					endpoint_id: webhookId,
				},
			});
		}
	},

	async run(context) {
		const payload = context.payload.body as {
			event_type: string;
			event_data: Record<string, any>;
		};

		if (payload.event_type !== 'avatar_video.fail') return [];

		return [payload];
	},
});
