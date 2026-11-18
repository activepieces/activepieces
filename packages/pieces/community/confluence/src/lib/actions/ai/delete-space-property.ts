import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteBlogPostPropertyOutputSchema } from '../../output-schemas';

export const deleteSpacePropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_space_property',
	outputSchema: confluenceDeleteBlogPostPropertyOutputSchema,
	displayName: 'Delete Space Property',
	description: 'Deletes a content property from a space.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a content property from a Confluence space. Get the property ID from List Space Properties. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		propertyId: confluenceAiProps.propertyId({ required: true }),
	},
	async run(context) {
		const { spaceId, propertyId } = context.propsValue;
		await confluenceApi.deleteContentProperty({
			auth: context.auth,
			contentType: 'spaces',
			contentId: spaceId,
			propertyId,
		});
		return { deleted: true, propertyId };
	},
});
