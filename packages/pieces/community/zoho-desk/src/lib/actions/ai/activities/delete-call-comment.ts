import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteCallCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_call_comment',
	outputSchema: zohoDeskDeleteCallCommentOutputSchema,
	displayName: 'Delete Call Comment',
	description: 'Deletes a comment from a call.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: { description: 'Permanently deletes one comment from a call.', idempotent: false },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		callId: Property.ShortText({
			displayName: 'Call ID',
			description: 'Call ID (from List Calls or Search Calls).',
			required: true,
		}),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Call Comments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, callId, commentId } = context.propsValue;
		await zohoDeskApi.deleteCallComment({ auth: context.auth, orgId, callId, commentId });
		return { success: true, callId, commentId };
	},
});
