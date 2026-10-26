import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetContactCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_contact_comment',
	outputSchema: zohoDeskCreateAccountCommentOutputSchema,
	displayName: 'Get Contact Comment',
	description: 'Gets one comment on a contact.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a contact, with its author and content.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Contact Comments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, commentId } = context.propsValue;
		return await zohoDeskApi.getContactComment({ auth: context.auth, orgId, contactId, commentId });
	},
});
