import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusApi } from '../../common/api';
import { listOutputSchema } from '../../output-schemas';

export const createListAiAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_create_list',
	outputSchema: listOutputSchema,
	displayName: 'Create List',
	description: 'Creates a new mailing list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new EmailOctopus mailing list and returns it with its ID. Each call makes a new list, even when the name matches an existing one; check List Lists first to avoid duplicates.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'The name of the new list.',
			required: true,
		}),
	},
	async run(context) {
		return await emailOctopusApi.createList({
			auth: context.auth,
			name: context.propsValue.name,
		});
	},
});
