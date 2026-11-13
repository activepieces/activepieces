import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { tagOutputSchema } from '../../output-schemas';

export const updateTagAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_tag',
	outputSchema: tagOutputSchema,
	displayName: 'Update Tag',
	description: 'Renames, archives or unarchives a tag.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renames a tag or archives / unarchives it. Only the fields you set change: the action reads the tag and sends the rest back unchanged. Archiving is required before Delete Tag.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		tagId: clockifyAiProps.tagId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		archived: Property.StaticDropdown({
			displayName: 'Archived',
			description: 'Archive (Yes) or unarchive (No) the tag. Empty = unchanged.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: 'true' },
					{ label: 'No', value: 'false' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const current = await clockifyApi.getTag({
			auth,
			workspaceId: propsValue.workspaceId,
			tagId: propsValue.tagId,
		});
		return await clockifyApi.updateTag({
			auth,
			workspaceId: propsValue.workspaceId,
			tagId: propsValue.tagId,
			name: propsValue.name ?? current.name,
			archived:
				clockifyUtils.toOptionalBoolean({ value: propsValue.archived }) ??
				current.archived ??
				false,
		});
	},
});
