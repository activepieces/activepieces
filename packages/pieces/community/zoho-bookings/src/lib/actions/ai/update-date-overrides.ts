import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsUpdateDateOverridesOutputSchema } from '../../output-schemas';

export const zohoBookingsUpdateDateOverridesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_update_date_overrides',
	outputSchema: zohoBookingsUpdateDateOverridesOutputSchema,
	displayName: 'Update Date Overrides',
	description: 'Update existing date overrides.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replace 1-10 existing date overrides by ID. Each override is sent in full (id, type and mode are required), so read it with List Date Overrides first and change only what you need.',
		idempotent: true,
	},
	props: {
		overrides: Property.Json({
			displayName: 'Overrides',
			description:
				'Array of 1-10 overrides, each with id, type, mode and the same fields as Create Date Overrides, e.g. [{"id": "82045000000210001", "type": "unavailability", "mode": "specific_dates", "dates": ["27-Dec-2026"], "all_day": true}].',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		const overrides = propsValue.overrides;
		if (!Array.isArray(overrides) || overrides.length === 0 || overrides.length > 10) {
			throw new Error('Overrides must be an array of 1 to 10 overrides.');
		}
		return await zohoBookingsApi.updateDateOverrides({ auth, overrides });
	},
});
