import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsCreateDateOverridesOutputSchema } from '../../output-schemas';

export const zohoBookingsCreateDateOverridesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_create_date_overrides',
	outputSchema: zohoBookingsCreateDateOverridesOutputSchema,
	displayName: 'Create Date Overrides',
	description: 'Block time off or add extra hours for the business, a staff member or a resource.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create 1-10 date overrides that block time (unavailability) or open extra hours (additional_availability) for the business, a staff member or a resource. Past dates are rejected. Returns each override with its ID. Not idempotent.',
		idempotent: false,
	},
	props: {
		availabilityFor: zohoBookingsAiProps.availabilityFor({ required: true }),
		availabilityForId: Property.ShortText({
			displayName: 'Staff or Resource ID',
			description: 'Required for a staff member or resource. Use List Staff or List Resources.',
			required: false,
		}),
		overrides: Property.Json({
			displayName: 'Overrides',
			description:
				'Array of 1-10 overrides. Each has type ("unavailability" or "additional_availability"), mode ("specific_dates" with dates ["27-Dec-2026"], "date_range" or "custom_range" with from_date/to_date "27-Dec-2026"), all_day (true/false), available_times [{"from_time": "09:00", "to_time": "13:00"}] when not all day, and an optional reason.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.availabilityFor !== 'business' && !propsValue.availabilityForId) {
			throw new Error('Staff or Resource ID is required unless Applies To is Business.');
		}
		const overrides = propsValue.overrides;
		if (!Array.isArray(overrides) || overrides.length === 0 || overrides.length > 10) {
			throw new Error('Overrides must be an array of 1 to 10 overrides.');
		}
		return await zohoBookingsApi.createDateOverrides({
			auth,
			availabilityFor: propsValue.availabilityFor,
			availabilityForId: propsValue.availabilityForId,
			overrides,
		});
	},
});
