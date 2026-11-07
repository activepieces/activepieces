import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateEventCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_event_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Update Event Comment',
	description: 'Edits a comment on a event.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Replaces the text of one comment on a event.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		eventId: Property.ShortText({
			displayName: 'Event ID',
			description: 'Event ID (from List Events or Search Events).',
			required: true,
		}),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Event Comments).',
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
		const { orgId, eventId, commentId, content, contentType } = context.propsValue;
		return await zohoDeskApi.updateEventComment({
			auth: context.auth,
			orgId,
			eventId,
			commentId,
			content,
			contentType,
		});
	},
});
