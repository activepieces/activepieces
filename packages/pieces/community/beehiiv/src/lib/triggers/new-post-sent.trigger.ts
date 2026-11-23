import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { publicationId } from '../common/props';
import { beehiivAuth } from '../common/auth';
import { apiKeyOf, beehiivClient, pathFor } from '../common/client';
import { beehiivWebhook } from '../common/webhook';
import { beehiivOutputSchemas } from '../common/output-schemas';

const TRIGGER_KEY = 'new-post-sent-trigger';

export const newPostSentTrigger = createTrigger({
	auth: beehiivAuth,
	name: 'beehiiv_new_post_sent',
	classification: 'READ',
	displayName: 'New Post Sent',
	description: 'Triggers when a post is sent or published in the selected publication. Requires a paid beehiiv plan (Lite allows 3 webhooks in total).',
	aiMetadata: {
		description: 'Fires once per post when beehiiv sends or publishes it (post.sent event) in the selected publication, emitting the post with its title, slug, audience, status and URLs. Retried deliveries of the same event are ignored.',
	},
	props: {
		publicationId: publicationId,
	},
	outputSchema: beehiivOutputSchemas.postPayload,
	type: TriggerStrategy.WEBHOOK,
	async onEnable(context) {
		await beehiivWebhook.enable({
			auth: context.auth,
			publicationId: context.propsValue.publicationId,
			webhookUrl: context.webhookUrl,
			eventTypes: ['post.sent'],
			description: 'Activepieces trigger: New Post Sent',
			store: context.store,
			storeKey: TRIGGER_KEY,
		});
	},
	async onDisable(context) {
		await beehiivWebhook.disable({
			auth: context.auth,
			publicationId: context.propsValue.publicationId,
			store: context.store,
			storeKey: TRIGGER_KEY,
		});
	},
	async test(context) {
		const page = await beehiivClient.listPage<Record<string, unknown>>({
			apiKey: apiKeyOf(context.auth),
			path: `${pathFor(['publications', context.propsValue.publicationId])}/posts`,
			operation: 'list posts',
			query: { status: 'confirmed', order_by: 'publish_date', direction: 'desc' },
			page: 1,
			limit: 5,
		});
		return page.items;
	},
	async run(context) {
		return beehiivWebhook.eventsFrom({
			body: context.payload.body,
			headers: context.payload.headers,
			store: context.store,
			storeKey: TRIGGER_KEY,
		});
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
