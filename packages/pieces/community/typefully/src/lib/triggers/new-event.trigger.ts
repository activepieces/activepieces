import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
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
		events: Property.StaticMultiSelectDropdown({
			displayName: 'Events',
			description: 'Filter which events trigger this flow. Leave empty to receive all events configured in Typefully.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Draft Created', value: 'draft.created' },
					{ label: 'Draft Scheduled', value: 'draft.scheduled' },
					{ label: 'Draft Published', value: 'draft.published' },
					{ label: 'Draft Status Changed', value: 'draft.status_changed' },
					{ label: 'Draft Tags Changed', value: 'draft.tags_changed' },
					{ label: 'Draft Deleted', value: 'draft.deleted' },
				],
			},
		}),
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
		const selectedEvents = context.propsValue.events as string[] | undefined;
		const inferredEvent = STATUS_TO_EVENT[draft.status] ?? 'draft.created';
		const eventToUse = selectedEvents && selectedEvents.length > 0
			? (selectedEvents.includes(inferredEvent) ? inferredEvent : selectedEvents[0])
			: inferredEvent;
		return [{ event: eventToUse, data: draft }];
	},
	async run(context) {
		const body = context.payload.body as { event?: string; data?: Record<string, unknown> };
		if (!body.data) return [];
		const selectedEvents = context.propsValue.events as string[] | undefined;
		if (selectedEvents && selectedEvents.length > 0 && body.event && !selectedEvents.includes(body.event)) {
			return [];
		}
		return [body];
	},
});
