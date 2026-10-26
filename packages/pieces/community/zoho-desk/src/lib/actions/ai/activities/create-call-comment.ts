import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateCallCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_call_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Create Call Comment',
	description: 'Adds a comment to a call.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an internal comment to one call. Not idempotent: each call adds another comment.',
		idempotent: false,
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
		content: Property.LongText({
			displayName: 'Content',
			description: 'Comment text. HTML unless Content Type is plainText.',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content. Defaults to html.',
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
		const { orgId, callId, content, contentType } = context.propsValue;
		return await zohoDeskApi.createCallComment({
			auth: context.auth,
			orgId,
			callId,
			content,
			contentType,
		});
	},
});
