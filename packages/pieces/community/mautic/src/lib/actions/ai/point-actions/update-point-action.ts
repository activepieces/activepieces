import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetPointActionOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdatePointActionAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_point_action',
	outputSchema: mauticGetPointActionOutputSchema,
	displayName: 'Update Point Action',
	description: 'Updates fields of a Mautic point action.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing point action. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Action Id',
			description: 'Numeric point action id, from List Point Actions or Create Point Action.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		type: Property.ShortText({
			displayName: 'Type',
			description:
				'Action type key, e.g. "email.open", "form.submit", "page.hit", "url.hit", "asset.download", from List Point Action Types.',
			required: false,
		}),
		delta: Property.Number({
			displayName: 'Points',
			description: 'Points to add when the action happens; negative to subtract.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		properties: Property.Json({
			displayName: 'Properties',
			description:
				'Type settings, e.g. {"emails": [12]} for email.open or {"page_url": "https://example.com/pricing"} for url.hit.',
			required: false,
		}),
		group: Property.Number({
			displayName: 'Point Group Id',
			description:
				'Point group to score in instead of the total, from List Point Groups (Mautic 5.1+).',
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
				'Other point action properties, e.g. "repeatable", "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			id,
			additionalFields,
			name,
			type,
			delta,
			description,
			properties,
			group,
			isPublished,
			category,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'points',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('type', type),
				...spreadIfDefined('delta', delta),
				...spreadIfDefined('description', description),
				...spreadIfDefined('properties', properties),
				...spreadIfDefined('group', group),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
			},
		});
	},
});
