import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateCallOutputSchema } from '../../../output-schemas';

export const zohoDeskGetCallAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_call',
	outputSchema: zohoDeskCreateCallOutputSchema,
	displayName: 'Get Call',
	description: 'Gets a call by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one call by ID with its subject, status, start time, duration, contact and ticket. Needs the Desk.calls.ALL scope.',
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
	},
	async run(context) {
		const { orgId, callId } = context.propsValue;
		return await zohoDeskApi.getCall({ auth: context.auth, orgId, callId });
	},
});
