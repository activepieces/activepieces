import { createAction, Property } from '@activepieces/pieces-framework';

import { emailOctopusAuth } from '../../auth';
import { emailOctopusAiProps } from '../../common/ai-props';
import { emailOctopusApi } from '../../common/api';
import { tagOutputSchema } from '../../output-schemas';

export const updateTagAction = createAction({
	auth: emailOctopusAuth,
	name: 'emailoctopus_update_tag',
	outputSchema: tagOutputSchema,
	displayName: 'Rename Tag',
	description: 'Renames a tag on a list.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a tag on an EmailOctopus list; contacts with the tag keep it under the new name. A repeat with the old name fails, since that tag no longer exists.',
		idempotent: false,
	},
	props: {
		listId: emailOctopusAiProps.listId({ required: true }),
		tag: emailOctopusAiProps.tag({ required: true }),
		newTag: Property.ShortText({
			displayName: 'New Tag',
			description: 'The new tag name.',
			required: true,
		}),
	},
	async run(context) {
		const { listId, tag, newTag } = context.propsValue;
		return await emailOctopusApi.updateTag({ auth: context.auth, listId, tag, newTag });
	},
});
