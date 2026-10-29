import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { tagOutputSchema } from '../../output-schemas';

export const createTagAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_create_tag',
	outputSchema: tagOutputSchema,
	displayName: 'Create Tag',
	description: 'Creates a tag on a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tag on an EmailOctopus list. Fails if the tag already exists. Contact actions can also add tags directly, which creates them as needed.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		tag: Property.ShortText({
			displayName: 'Tag',
			description: 'The tag name.',
			required: true,
		}),
	},
	async run(context) {
		const { listId, tag } = context.propsValue;
		return await emailOctopusApi.createTag({ auth: context.auth, listId, tag });
	},
});
