import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountAttachmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListEventAttachmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_event_attachments',
	outputSchema: zohoDeskListAccountAttachmentsOutputSchema,
	displayName: 'List Event Attachments',
	description: 'Lists the files attached to a event.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files attached to one event, with name, size and download link (`href`).',
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
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, eventId, from, limit } = context.propsValue;
		const attachments = await zohoDeskApi.listEventAttachments({
			auth: context.auth,
			orgId,
			eventId,
			from,
			limit,
		});
		return { attachments, count: attachments.length };
	},
});
