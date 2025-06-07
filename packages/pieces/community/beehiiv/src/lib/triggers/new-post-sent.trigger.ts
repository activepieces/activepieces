import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { beehiivApiCall, WebhookPayload } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'new-post-sent-trigger';

export const newPostSentTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_new_post_sent',
	displayName: 'New Post Sent',
	description: 'Triggers when a new post is sent.',
	props: {
		publicationId: publicationId,
	},
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		const { publicationId } = context.propsValue;
		const response = await beehiivApiCall<{ data: { id: string } }>({
			apiKey: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/publications/${publicationId}/webhooks`,
			body: {
				url: context.webhookUrl,
				event_types: ['post.sent'],
			},
		});

		await context.store.put<string>(TRIGGER_KEY, response.data.id);
	},
	async onDisable(context) {
		const { publicationId } = context.propsValue;

		const webhookId = await context.store.get<string>(TRIGGER_KEY);
		if (!isNil(webhookId)) {
			await beehiivApiCall({
				apiKey: context.auth,
				method: HttpMethod.DELETE,
				resourceUri: `/publications/${publicationId}/webhooks/${webhookId}`,
			});
		}
	},
	async run(context) {
		const payload = context.payload.body as WebhookPayload;
		return [payload.data];
	},
	sampleData: {
		audience: 'free',
		authors: ['Clark Kent'],
		content_tags: ['news'],
		created: 1666800076,
		id: 'post_00000000-0000-0000-0000-000000000000',
		preview_text: 'More news on the horizon',
		slug: 'more_news',
		split_tested: true,
		status: 'confirmed',
		subject_line: 'Check this out',
		subtitle: 'New post subtitle',
		thumbnail_url: 'https://example.com/pictures/thumbnail.png',
		title: 'New Post Title',
		displayed_date: 1666800076,
		web_url: 'https://example.com/more_news',
	},
});
