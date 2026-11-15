import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticUpdateSegmentOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateSegmentAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_segment',
	outputSchema: mauticUpdateSegmentOutputSchema,
	displayName: 'Update Segment',
	description: 'Updates fields of a Mautic segment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing segment. Filters, when given, replace the existing filters. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Segment Id',
			description: 'Numeric segment id, from List Segments or Create Segment.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
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
			id,
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
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'segments',
			id,
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
