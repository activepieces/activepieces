import { createAction, Property } from '@activepieces/pieces-framework';

import { senderAuth } from '../../auth';
import { senderApi } from '../../common/api';
import { senderFieldWriteOutputSchema } from '../../output-schemas';

export const senderCreateFieldAction = createAction({
	auth: senderAuth,
	name: 'sender_create_field',
	outputSchema: senderFieldWriteOutputSchema,
	displayName: 'Create Field',
	description: 'Creates a custom subscriber field.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a custom subscriber field of type text, number or datetime and returns it with its ID and field_name. Each call creates a separate field.',
		idempotent: false,
	},
	props: {
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Name of the new field.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Value type of the field.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Text', value: 'text' },
					{ label: 'Number', value: 'number' },
					{ label: 'Date and time', value: 'datetime' },
				],
			},
		}),
	},
	async run(context) {
		return await senderApi.createField({ auth: context.auth, ...context.propsValue });
	},
});
