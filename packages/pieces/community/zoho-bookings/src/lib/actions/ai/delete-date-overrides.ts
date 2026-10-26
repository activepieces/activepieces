import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsStatusMessageOutputSchema } from '../../output-schemas';

export const zohoBookingsDeleteDateOverridesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_delete_date_overrides',
	outputSchema: zohoBookingsStatusMessageOutputSchema,
	displayName: 'Delete Date Overrides',
	description: 'Delete date overrides by ID.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently delete 1-10 date overrides by ID, restoring the regular working hours for those dates. Use List Date Overrides for the IDs.',
		idempotent: false,
	},
	props: {
		ids: Property.Array({
			displayName: 'Override IDs',
			description: '1-10 IDs from List Date Overrides.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const ids = propsValue.ids;
		if (
			ids.length === 0 ||
			ids.length > 10 ||
			!ids.every((id): id is string => typeof id === 'string' && id !== '')
		) {
			throw new Error('Override IDs must hold 1 to 10 non-empty IDs.');
		}
		return await zohoBookingsApi.deleteDateOverrides({ auth, ids });
	},
});
