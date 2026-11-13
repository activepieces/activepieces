import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateEventOutputSchema } from '../../../output-schemas';

export const zohoDeskGetEventAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_event',
	outputSchema: zohoDeskCreateEventOutputSchema,
	displayName: 'Get Event',
	description: 'Gets an event by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one event by ID with its subject, start time, duration, contact and ticket.',
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
	},
	async run(context) {
		const { orgId, eventId } = context.propsValue;
		return await zohoDeskApi.getEvent({ auth: context.auth, orgId, eventId });
	},
});
