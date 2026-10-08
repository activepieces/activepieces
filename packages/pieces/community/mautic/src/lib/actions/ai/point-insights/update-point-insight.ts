import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdatePointInsightAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_point_insight',
	displayName: 'Update Point Insight',
	description: 'Updates fields of a Mautic point insight.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing point insight. Needs Mautic 7. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Point Insight Id',
			description: 'Numeric point insight id, from List Point Insights or Create Point Insight.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		pointGroups: Property.Array({
			displayName: 'Point Group Ids',
			description: 'Point groups to compare, from List Point Groups.',
			required: false,
		}),
		customField: Property.ShortText({
			displayName: 'Custom Field',
			description: 'Alias of the contact field that receives the result, from List Contact Fields.',
			required: false,
		}),
		insightType: Property.ShortText({
			displayName: 'Insight Type',
			description: 'How the groups are compared; defaults to comparing point groups.',
			required: false,
		}),
		insightAction: Property.ShortText({
			displayName: 'Insight Action',
			description: 'What is done with the result; defaults to setting the custom field.',
			required: false,
		}),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other point insight properties. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			id,
			additionalFields,
			name,
			description,
			pointGroups,
			customField,
			insightType,
			insightAction,
			category,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'points/insights',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('pointGroups', pointGroups),
				...spreadIfDefined('customField', customField),
				...spreadIfDefined('insightType', insightType),
				...spreadIfDefined('insightAction', insightAction),
				...spreadIfDefined('category', category),
			},
		});
	},
});
