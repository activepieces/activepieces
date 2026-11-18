import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetCallCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_call_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Get Call Comment',
	description: 'Gets one comment on a call.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a call, with its author and content.',
		idempotent: true,
	},
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
		return await zohoDeskApi.getCallComment({ auth: context.auth, orgId, callId, commentId });
	},
});
