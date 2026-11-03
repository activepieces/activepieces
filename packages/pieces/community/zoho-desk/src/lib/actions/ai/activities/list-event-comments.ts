import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListCallCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListEventCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_event_comments',
	outputSchema: zohoDeskListCallCommentsOutputSchema,
	displayName: 'List Event Comments',
	description: 'Lists the comments on a event.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the comments on one event (agent notes).', idempotent: true },
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
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, eventId, from, limit } = context.propsValue;
		const comments = await zohoDeskApi.listEventComments({
			auth: context.auth,
			orgId,
			eventId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
