import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateTagOutputSchema } from '../../output-schemas';

export const createTagAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_tag',
	outputSchema: ticktickCreateTagOutputSchema,
	displayName: 'Create Tag',
	description: 'Creates a tag.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a tag with the given label; its name is the label lowercased and trimmed. Check ticktick_list_tags first to avoid duplicates. Not idempotent, and the API has no delete-tag endpoint.',
		idempotent: false,
	},
	props: {
		label: Property.ShortText({
			displayName: 'Label',
			description: 'The tag label (max 64 characters).',
			required: true,
		}),
	},
	async run(context) {
		const label = context.propsValue.label.trim();
		if (label.length === 0 || label.length > 64) {
			throw new Error('Label must be between 1 and 64 characters.');
		}
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/tag',
			body: { name: label.toLowerCase(), label },
		});
	},
});
