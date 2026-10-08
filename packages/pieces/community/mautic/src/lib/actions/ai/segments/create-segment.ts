import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateSegmentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_segment',
	outputSchema: mauticCreateSegmentOutputSchema,
	displayName: 'Create Segment',
	description: 'Creates a Mautic segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a segment. Name is required. Add Filters to make it dynamic, or leave them out and add contacts with Add Contact to Segment.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		alias: Property.ShortText({
			displayName: 'Alias',
			description: 'Unique alias; generated from the name when empty.',
			required: false,
		}),
		publicName: Property.ShortText({
			displayName: 'Public Name',
			description: 'Name shown to contacts in the preference center.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		isGlobal: mauticAiProps.yesNo({
			displayName: 'Global',
			description: 'Whether other users can use the segment.',
		}),
		isPreferenceCenter: mauticAiProps.yesNo({
			displayName: 'Preference Center',
			description: 'Whether contacts can join or leave it in the preference center.',
		}),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		filters: Property.Array({
			displayName: 'Filters',
			description:
				'Segment filters, each an object such as {"glue": "and", "field": "email", "object": "lead", "type": "email", "operator": "like", "properties": {"filter": "%@example.com"}}. Without filters the segment has only manually added contacts.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other segment properties from the Mautic segment API. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			alias,
			publicName,
			description,
			isPublished,
			isGlobal,
			isPreferenceCenter,
			category,
			filters,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'segments',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('alias', alias),
				...spreadIfDefined('publicName', publicName),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('isGlobal', isGlobal),
				...spreadIfDefined('isPreferenceCenter', isPreferenceCenter),
				...spreadIfDefined('category', category),
				...spreadIfDefined('filters', filters),
			},
		});
	},
});
