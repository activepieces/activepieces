import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsCreateResourceOutputSchema } from '../../output-schemas';

export const zohoBookingsCreateResourceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_create_resource',
	outputSchema: zohoBookingsCreateResourceOutputSchema,
	displayName: 'Create Resource',
	description: 'Create a bookable resource, such as a room or equipment.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create a bookable resource (a room, equipment) in one or more workspaces. Returns the new resource with its ID. Resources depend on the account plan. Not idempotent.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		workspaceIds: Property.Array({
			displayName: 'Workspace IDs',
			description: 'Workspaces the resource belongs to (at least one). Use List Workspaces.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.workspaceIds.length === 0) {
			throw new Error('Workspace IDs needs at least one workspace ID.');
		}
		return await zohoBookingsApi.createResource({ auth, ...propsValue });
	},
});
