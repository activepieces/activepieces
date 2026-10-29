import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsStatusMessageOutputSchema } from '../../output-schemas';

export const zohoBookingsDeleteServiceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_delete_service',
	outputSchema: zohoBookingsStatusMessageOutputSchema,
	displayName: 'Delete Service',
	description: 'Permanently delete a one-on-one service.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently delete a one-on-one service by ID. To hide it instead, set its status to inactive with Update Service. Use List Services for the ID.',
		idempotent: false,
	},
	props: {
		serviceId: zohoBookingsAiProps.serviceId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.deleteService({ auth, serviceId: propsValue.serviceId });
	},
});
