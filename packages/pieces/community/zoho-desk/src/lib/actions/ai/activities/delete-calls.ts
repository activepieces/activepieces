import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskDeleteCallsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteCallsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_calls',
	outputSchema: zohoDeskDeleteCallsOutputSchema,
	displayName: 'Delete Calls',
	description: 'Moves calls to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Moves one or more calls to the recycle bin. Needs the Desk.calls.ALL scope.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		callIds: Property.Array({
			displayName: 'Call IDs',
			description: 'Call IDs to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, callIds } = context.propsValue;
		await zohoDeskApi.deleteCalls({
			auth: context.auth,
			orgId,
			callIds: zohoDeskUtils.requiredStringList({ value: callIds, propName: 'Call IDs' }),
		});
		return { success: true, callIds };
	},
});
