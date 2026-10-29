import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateEventCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_event_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Create Event Comment',
	description: 'Adds a comment to a event.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an internal comment to one event. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
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
		const { orgId, eventId, content, contentType } = context.propsValue;
		return await zohoDeskApi.createEventComment({
			auth: context.auth,
			orgId,
			eventId,
			content,
			contentType,
		});
	},
});
