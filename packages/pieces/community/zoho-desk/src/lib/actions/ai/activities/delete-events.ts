import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskDeleteEventsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteEventsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_events',
	outputSchema: zohoDeskDeleteEventsOutputSchema,
	displayName: 'Delete Events',
	description: 'Moves events to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: { description: 'Moves one or more events to the recycle bin.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		eventIds: Property.Array({
			displayName: 'Event IDs',
			description: 'Event IDs to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, eventIds } = context.propsValue;
		await zohoDeskApi.deleteEvents({
			auth: context.auth,
			orgId,
			eventIds: zohoDeskUtils.requiredStringList({ value: eventIds, propName: 'Event IDs' }),
		});
		return { success: true, eventIds };
	},
});
