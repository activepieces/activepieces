import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsStatusMessageOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateServiceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_service',
	outputSchema: zohoBookingsStatusMessageOutputSchema,
	displayName: 'Update Service',
	description: 'Update a one-on-one service.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Change a one-on-one service's name, duration, cost, buffers, description, assigned staff, meeting mode or status (active or inactive). Only the fields you pass change; Staff IDs replaces the whole assigned list. Use List Services for the ID.",
		idempotent: true,
	},
	props: {
		serviceId: zohoBookingsAiProps.serviceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Inactive', value: 'in_active' },
				],
			},
		}),
		...zohoBookingsAiProps.serviceFields(),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.updateService({ auth, ...propsValue });
	},
});
