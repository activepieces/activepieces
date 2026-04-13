import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { typefullyAuth } from '../auth';
import { instructionsMarkdown, sampleData } from '../common/props';

export const newEventTrigger = createTrigger({
	auth: typefullyAuth,
	name: 'typefully_new_event',
	displayName: 'New Event',
	description:
		'Triggers when a specific webhook event is received from Typefully.',
	type: TriggerStrategy.WEBHOOK,
	props: {
		instructions: instructionsMarkdown,
		event: Property.StaticDropdown({
			displayName: 'Event',
			description: 'The Typefully event to listen for.',
			required: true,
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
	sampleData: sampleData,
	async onEnable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async onDisable() {
		// Typefully webhooks are configured manually in the dashboard (Settings → API → Webhooks).
	},
	async run(context) {
		const body = context.payload.body as { event: string, data: Record<string, any> };
		if (body.event !== context.propsValue.event) return [];
		return [body.data];
	},
});
