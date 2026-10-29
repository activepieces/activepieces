import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsDeleteRecordOutputSchema } from '../../output-schemas';

export const zohoBookingsDeleteResourceAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_delete_resource',
	outputSchema: zohoBookingsDeleteRecordOutputSchema,
	displayName: 'Delete Resource',
	description: 'Permanently delete a resource.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently delete a resource by ID. Fails while it is assigned to a service or has upcoming appointments. To hide it instead, set its status to inactive with Update Resource.',
		idempotent: false,
	},
	props: {
		resourceId: zohoBookingsAiProps.resourceId({ required: true }),
		ignorePastAppointments: Property.Checkbox({
			displayName: 'Update Past Appointments',
			description: 'Also update the resource details on past appointments. Defaults to false.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoBookingsApi.deleteResource({
			auth,
			resourceId: propsValue.resourceId,
			ignorePastAppointments: propsValue.ignorePastAppointments,
		});
	},
});
