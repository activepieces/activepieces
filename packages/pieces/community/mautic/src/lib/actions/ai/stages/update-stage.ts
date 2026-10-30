import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetStageOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateStageAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_stage',
	outputSchema: mauticGetStageOutputSchema,
	displayName: 'Update Stage',
	description: 'Updates fields of a Mautic stage.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing stage. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Stage Id',
			description: 'Numeric stage id, from List Stages or Create Stage.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
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
		const { id, additionalFields, name, weight, description, isPublished, category } =
			context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'stages',
			id,
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
