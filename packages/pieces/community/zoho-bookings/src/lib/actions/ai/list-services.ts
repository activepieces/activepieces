import { createAction } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsListServicesOutputSchema } from '../../output-schemas';

export const zohoBookingsListServicesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_list_services',
	outputSchema: zohoBookingsListServicesOutputSchema,
	displayName: 'List Services',
	description: 'List the services in a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List the services in a workspace with their IDs, durations, costs and assigned staff, optionally narrowed to one service or to the services a staff member offers. Inactive services are not returned. Use List Workspaces for the workspace ID.',
		idempotent: true,
	},
	props: {
		workspaceId: zohoBookingsAiProps.workspaceId({ required: true }),
		serviceId: zohoBookingsAiProps.serviceId({
			required: false,
			description: 'Return only this service.',
		}),
		staffId: zohoBookingsAiProps.staffId({
			required: false,
			description: 'Return only services this staff member offers.',
		}),
	},
	async run({ auth, propsValue }) {
		const services = await zohoBookingsApi.listServices({
			auth,
			workspaceId: propsValue.workspaceId,
			serviceId: propsValue.serviceId,
			staffId: propsValue.staffId,
		});
		return { services, count: services.length };
	},
});
