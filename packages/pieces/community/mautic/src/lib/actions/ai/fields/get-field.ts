import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticGetFieldOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetFieldAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_field',
	outputSchema: mauticGetFieldOutputSchema,
	displayName: 'Get Field',
	description: 'Gets one Mautic field by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets a single contact or company field by its numeric id.',
		idempotent: true,
	},
	props: {
		object: Property.StaticDropdown({
			displayName: 'Object',
			required: true,
			options: {
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Company', value: 'company' },
				],
			},
		}),
		id: mauticAiProps.recordId({
			displayName: 'Field Id',
			description: 'Numeric field id, from List Fields or Create Field.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: `fields/${context.propsValue.object}`,
			id: context.propsValue.id,
		});
	},
});
