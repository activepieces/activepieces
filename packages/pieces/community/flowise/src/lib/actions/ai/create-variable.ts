import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseVariableOutputSchema } from '../../output-schemas';

export const createVariableAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_variable',
	outputSchema: flowiseVariableOutputSchema,
	displayName: 'Create Variable',
	description: 'Creates a workspace variable.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a workspace variable that flows read as `$vars.<name>`. A static variable stores the value; a runtime variable reads the environment variable of the same name. Each call creates another variable.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Variable name.',
			required: true,
		}),
		value: Property.LongText({
			displayName: 'Value',
			description:
				'Value of the variable. Required for runtime variables too, where it is ignored.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description:
				'Static stores the value; runtime reads the server environment variable. Defaults to static.',
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
		const { name, value, type } = context.propsValue;
		return await flowiseApi.createVariable({
			auth: context.auth,
			fields: { name, value, type: type ?? 'static' },
		});
	},
});
