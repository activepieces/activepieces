import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreatePointTriggerOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreatePointTriggerAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_point_trigger',
	outputSchema: mauticCreatePointTriggerOutputSchema,
	displayName: 'Create Point Trigger',
	description: 'Creates a Mautic point trigger.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a point trigger. Name and Points are required.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		points: Property.Number({
			displayName: 'Points',
			description: 'Score at which the trigger fires.',
			required: true,
		}),
		events: Property.Array({
			displayName: 'Events',
			description:
				'What happens when it fires, each like {"name": "Add tag", "type": "lead.changetags", "properties": {"add_tags": ["hot"]}}. Types come from List Point Trigger Event Types. On update, events with an "id" are edited and others added.',
			required: false,
		}),
		triggerExistingLeads: mauticAiProps.yesNo({
			displayName: 'Apply to Existing Contacts',
			description: 'Whether contacts already at the score get the events.',
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color without "#", e.g. "a0acb8".',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		group: Property.Number({
			displayName: 'Point Group Id',
			description:
				'Point group whose score is watched instead of the total, from List Point Groups (Mautic 5.1+).',
			required: false,
		}),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other point trigger properties, e.g. "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			points,
			events,
			triggerExistingLeads,
			color,
			description,
			group,
			isPublished,
			category,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'points/triggers',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('points', points),
				...spreadIfDefined('events', events),
				...spreadIfDefined('triggerExistingLeads', triggerExistingLeads),
				...spreadIfDefined('color', color),
				...spreadIfDefined('description', description),
				...spreadIfDefined('group', group),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
			},
		});
	},
});
