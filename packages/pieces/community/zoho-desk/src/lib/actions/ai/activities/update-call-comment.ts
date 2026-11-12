import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateCallCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_call_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Update Call Comment',
	description: 'Edits a comment on a call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Replaces the text of one comment on a call.', idempotent: true },
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
		content: Property.LongText({
			displayName: 'Content',
			description: 'New comment text.',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'html', value: 'html' },
					{ label: 'plainText', value: 'plainText' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, callId, commentId, content, contentType } = context.propsValue;
		return await zohoDeskApi.updateCallComment({
			auth: context.auth,
			orgId,
			callId,
			commentId,
			content,
			contentType,
		});
	},
});
