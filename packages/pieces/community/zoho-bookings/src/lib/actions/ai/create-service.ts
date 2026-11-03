import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsCreatedRecordOutputSchema } from '../../output-schemas';

export const zohoBookingsCreateServiceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_create_service',
	outputSchema: zohoBookingsCreatedRecordOutputSchema,
	displayName: 'Create Service',
	description: 'Create a one-on-one or resource service in a workspace.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create a one-on-one or resource-booking service in a workspace (group and collective services are not supported). Returns the new service ID. Not idempotent.',
		idempotent: false,
	},
	props: {
		workspaceId: zohoBookingsAiProps.workspaceId({ required: true }),
		name: Property.ShortText({ displayName: 'Name', required: true }),
		serviceType: Property.StaticDropdown({
			displayName: 'Service Type',
			description: 'Defaults to one-on-one.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'One-on-one', value: 'one_on_one' },
					{ label: 'Resource', value: 'resource' },
				],
			},
		}),
		...zohoBookingsAiProps.serviceFields(),
		resourceIds: Property.Array({
			displayName: 'Resource IDs',
			description: 'Resources to assign (resource services). Use List Resources.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.createService({ auth, ...propsValue });
	},
});
