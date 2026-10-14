import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseVariableOutputSchema } from '../../output-schemas';

export const updateVariableAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_variable',
	outputSchema: flowiseVariableOutputSchema,
	displayName: 'Update Variable',
	description: 'Updates a workspace variable. Only the fields you set are changed.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a workspace variable by ID: name, value or type. Fields left empty stay as they are.',
		idempotent: true,
	},
	props: {
		variableId: Property.ShortText({
			displayName: 'Variable ID',
			description: 'ID of the variable, from List Variables.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New variable name.',
			required: false,
		}),
		value: Property.LongText({ displayName: 'Value', description: 'New value.', required: false }),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Static stores the value; runtime reads the server environment variable.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Static', value: 'static' },
					{ label: 'Runtime', value: 'runtime' },
				],
			},
		}),
	},
	async run(context) {
		const { variableId, name, value, type } = context.propsValue;
		return await flowiseApi.updateVariable({
			auth: context.auth,
			variableId,
			fields: { name, value, type },
		});
	},
});
