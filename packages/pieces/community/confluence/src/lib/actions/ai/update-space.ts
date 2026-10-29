import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateSpaceOutputSchema } from '../../output-schemas';

export const updateSpaceAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_space',
	outputSchema: confluenceUpdateSpaceOutputSchema,
	displayName: 'Update Space',
	description: 'Updates the name, description, homepage or status of a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a Confluence space identified by its key, changing only the name, description, homepage or status you set. Needs space admin. Idempotent: repeating the same update leaves the space unchanged.',
		idempotent: true,
	},
	props: {
		spaceKey: confluenceAiProps.spaceKey({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'New name. Leave empty to keep it.',
			required: false,
		}),
		description: Property.LongText({
			displayName: 'Description',
			description: 'New plain-text description. Leave empty to keep it.',
			required: false,
		}),
		homepageId: confluenceAiProps.pageId({
			required: false,
			displayName: 'Homepage ID',
			description: 'Page to make the space homepage. Leave empty to keep it.',
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Archive or restore the space. Leave empty to keep it.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'current' },
					{ label: 'Archived', value: 'archived' },
				],
			},
		}),
	},
	async run(context) {
		const { spaceKey, name, description, homepageId, status } = context.propsValue;
		if (
			name === undefined &&
			description === undefined &&
			homepageId === undefined &&
			status === undefined
		) {
			throw new Error('Set at least one of Name, Description, Homepage ID or Status.');
		}
		return await confluenceApi.updateSpace({
			auth: context.auth,
			spaceKey,
			name,
			description,
			homepageId,
			status,
		});
	},
});
