import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateCampaignOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_campaign',
	outputSchema: mauticCreateCampaignOutputSchema,
	displayName: 'Create Campaign',
	description: 'Creates a Mautic campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a campaign. Name, at least one event and a contact source (a segment in "lists" or a form in "forms") are required; Mautic rejects a campaign without them. Events, source segments and forms go in Additional Fields, e.g. {"events": [{"id": "new1", "name": "Add points", "type": "lead.changepoints", "eventType": "action", "order": 1, "properties": {"points": 1}, "triggerMode": "immediate"}], "lists": [{"id": 1}], "canvasSettings": {"nodes": [...], "connections": [...]}}.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		allowRestart: mauticAiProps.yesNo({
			displayName: 'Allow Restart',
			description: 'Whether contacts can go through the campaign more than once.',
		}),
		publishUp: Property.ShortText({
			displayName: 'Publish Up',
			description: 'Start date/time, e.g. "2026-01-01 09:00:00".',
			required: false,
		}),
		publishDown: Property.ShortText({
			displayName: 'Publish Down',
			description: 'End date/time, e.g. "2026-12-31 18:00:00".',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other campaign properties, such as "events", "lists" (segment ids as [{"id": 1}]), "forms" and "canvasSettings", in the shape Get Campaign returns. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			description,
			isPublished,
			category,
			allowRestart,
			publishUp,
			publishDown,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'campaigns',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('allowRestart', allowRestart),
				...spreadIfDefined('publishUp', publishUp),
				...spreadIfDefined('publishDown', publishDown),
			},
		});
	},
});
