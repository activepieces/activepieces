import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreatePointActionOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreatePointActionAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_point_action',
	outputSchema: mauticCreatePointActionOutputSchema,
	displayName: 'Create Point Action',
	description: 'Creates a Mautic point action.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a point action. Name, Type and Points are required. Mautic ignores Properties on create, so set them afterwards with Update Point Action.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		type: Property.ShortText({
			displayName: 'Type',
			description:
				'Action type key, e.g. "email.open", "form.submit", "page.hit", "url.hit", "asset.download", from List Point Action Types.',
			required: true,
		}),
		delta: Property.Number({
			displayName: 'Points',
			description: 'Points to add when the action happens; negative to subtract.',
			required: true,
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
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'points',
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
