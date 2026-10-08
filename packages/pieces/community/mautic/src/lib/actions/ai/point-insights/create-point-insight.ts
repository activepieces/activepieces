import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreatePointInsightAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_point_insight',
	displayName: 'Create Point Insight',
	description: 'Creates a Mautic point insight.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a point insight. Name is required. Needs Mautic 7.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
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
			additionalFields,
			name,
			description,
			pointGroups,
			customField,
			insightType,
			insightAction,
			category,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'points/insights',
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
