import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateStageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateStageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_stage',
	outputSchema: mauticCreateStageOutputSchema,
	displayName: 'Create Stage',
	description: 'Creates a Mautic stage.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a lifecycle stage. Name is required.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		weight: Property.Number({
			displayName: 'Weight',
			description: 'Order of the stage in the lifecycle; higher is further along.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other stage properties, e.g. "publishUp", "publishDown". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, name, weight, description, isPublished, category } =
			context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'stages',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('weight', weight),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
			},
		});
	},
});
