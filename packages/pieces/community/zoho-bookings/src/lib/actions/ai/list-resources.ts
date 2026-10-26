import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsListResourcesOutputSchema } from '../../output-schemas';

export const zohoBookingsListResourcesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_list_resources',
	outputSchema: zohoBookingsListResourcesOutputSchema,
	displayName: 'List Resources',
	description: 'List bookable resources, such as rooms or equipment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List bookable resources (rooms, equipment) with their IDs and names, optionally narrowed to one resource or to those assigned to a service. Resource IDs are needed by Book Appointment and Get Available Slots.',
		idempotent: true,
	},
	props: {
		serviceId: zohoBookingsAiProps.serviceId({
			required: false,
			description: 'Only resources assigned to this service.',
		}),
		resourceId: zohoBookingsAiProps.resourceId({
			required: false,
			description: 'Return only this resource.',
		}),
	},
	async run({ auth, propsValue }) {
		const resources = await zohoBookingsApi.listResources({
			auth,
			serviceId: propsValue.serviceId,
			resourceId: propsValue.resourceId,
		});
		return { resources, count: resources.length };
	},
});
