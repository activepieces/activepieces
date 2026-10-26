import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseToolOutputSchema } from '../../output-schemas';

export const updateToolAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_update_tool',
	outputSchema: flowiseToolOutputSchema,
	displayName: 'Update Tool',
	description: 'Updates a custom tool. Only the fields you set are changed.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a custom tool by ID: name, description, color, input schema, function or icon. Fields left empty stay as they are.',
		idempotent: true,
	},
	props: {
		toolId: Property.ShortText({
			displayName: 'Tool ID',
			description: 'ID of the tool, from List Tools.',
			required: true,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New tool name.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New description.',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'New card color.',
			required: false,
		}),
		schema: Property.LongText({
			displayName: 'Input Schema',
			description: 'New input schema as a JSON string array; replaces the current one.',
			required: false,
		}),
		func: Property.LongText({
			displayName: 'Function',
			description: 'New JavaScript function.',
			required: false,
		}),
		iconSrc: Property.ShortText({
			displayName: 'Icon URL',
			description: 'New icon URL.',
			required: false,
		}),
	},
	async run(context) {
		const { toolId, name, description, color, schema, func, iconSrc } = context.propsValue;
		return await flowiseApi.updateTool({
			auth: context.auth,
			toolId,
			fields: { name, description, color, schema, func, iconSrc },
		});
	},
});
