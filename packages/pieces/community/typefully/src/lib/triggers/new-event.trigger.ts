import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { typefullyAuth } from '../auth';
import { typefullyApiCall } from '../common/client';
import { draftSampleData, instructionsMarkdown } from '../common/props';
import {
	TypefullyDraft,
	TypefullyPaginatedResponse,
	TypefullySocialSet,
} from '../common/types';

const STATUS_TO_EVENT: Record<string, string> = {
	draft: 'draft.created',
	scheduled: 'draft.scheduled',
	published: 'draft.published',
};

async function fetchLatestDraft(apiKey: string) {
	const socialSets = await typefullyApiCall<TypefullyPaginatedResponse<TypefullySocialSet>>({
		apiKey,
		method: HttpMethod.GET,
		resourceUri: '/social-sets',
		query: { limit: 1 },
	});

	const firstSocialSet = socialSets.results[0];
	if (!firstSocialSet) return null;

	const drafts = await typefullyApiCall<TypefullyPaginatedResponse<TypefullyDraft>>({
		apiKey,
		method: HttpMethod.GET,
		resourceUri: `/social-sets/${firstSocialSet.id}/drafts`,
		query: { limit: 1, order_by: '-updated_at' },
	});

	return drafts.results[0] ?? null;
}

export const newEventTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_new_event',
	displayName: 'New Event',
	description: 'Triggers when a webhook event is received from Typefully.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: instructionsMarkdown,
	},
	sampleData: {
		event: 'draft.created',
		data: draftSampleData,
	},
	async onEnable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async onDisable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async test(context) {
		const draft = await fetchLatestDraft(context.auth.secret_text);
		if (!draft) return [];
		return [
			{
				event: STATUS_TO_EVENT[draft.status] ?? 'draft.created',
				data: draft,
			},
		];
	},
	async run(context) {
		const body = context.payload.body as { event?: string; data?: Record<string, unknown> };
		if (!body.data) return [];
		return [body];
	},
});
