import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetEventCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_event_comment',
	outputSchema: zohoDeskCreateCallCommentOutputSchema,
	displayName: 'Get Event Comment',
	description: 'Gets one comment on a event.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a event, with its author and content.',
		idempotent: true,
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
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Event Comments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, eventId, commentId } = context.propsValue;
		return await zohoDeskApi.getEventComment({ auth: context.auth, orgId, eventId, commentId });
	},
});
