import { createAction, Property } from '@activepieces/pieces-framework';

import { flowiseAuth } from '../../auth';
import { flowiseApi } from '../../common/api';
import { flowiseToolOutputSchema } from '../../output-schemas';

export const createToolAction = createAction({
	auth: flowiseAuth,
	name: 'flowise_create_tool',
	outputSchema: flowiseToolOutputSchema,
	displayName: 'Create Tool',
	description: 'Creates a custom tool that flows can call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a custom tool: a name and description the LLM sees, an optional input schema and the JavaScript function it runs. Each call creates another tool.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Tool name the LLM sees, in snake_case, e.g. `get_weather`.',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'What the tool does and when the LLM should call it.',
			required: true,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description:
				'Background color of the tool card, e.g. `linear-gradient(rgb(0,0,0), rgb(0,0,0))` or `#4CAF50`.',
			required: true,
		}),
		schema: Property.LongText({
			displayName: 'Input Schema',
			description:
				'JSON string array of input fields, e.g. `[{"id":0,"property":"city","type":"string","description":"City name","required":true}]`.',
			required: false,
		}),
		func: Property.LongText({
			displayName: 'Function',
			description:
				'JavaScript the tool runs. Inputs are available as `$<property>`, e.g. `$city`. Must return a string.',
			required: false,
		}),
		iconSrc: Property.ShortText({
			displayName: 'Icon URL',
			description: 'URL of the tool icon.',
			required: false,
		}),
	},
	async run(context) {
		const { name, description, color, schema, func, iconSrc } = context.propsValue;
		return await flowiseApi.createTool({
			auth: context.auth,
			fields: { name, description, color, schema, func, iconSrc },
		});
	},
});
