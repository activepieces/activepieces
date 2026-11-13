import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoBookingsAuth } from '../../auth';
import { zohoBookingsAiProps } from '../../common/ai-props';
import { zohoBookingsApi } from '../../common/api';
import { zohoBookingsListDateOverridesOutputSchema } from '../../output-schemas';

const OVERRIDE_TYPE_OPTIONS = [
	{ label: 'Unavailability', value: 'unavailability' },
	{ label: 'Additional availability', value: 'additional_availability' },
];

export const zohoBookingsListDateOverridesAction = createAction({
	auth: zohoBookingsAuth,
	name: 'zoho_bookings_list_date_overrides',
	outputSchema: zohoBookingsListDateOverridesOutputSchema,
	displayName: 'List Date Overrides',
	description:
		'List the date overrides (time off or extra hours) for the business, a staff member or a resource.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'List date overrides (unavailability or additional availability) for the business, a staff member or a resource, optionally within a date range. Returns up to 50 per page; when next_page_available is true, call again with the next page and the same filters. Override IDs are needed by Update and Delete Date Overrides.',
		idempotent: true,
	},
	props: {
		availabilityFor: zohoBookingsAiProps.availabilityFor({ required: true }),
		availabilityForId: Property.ShortText({
			displayName: 'Staff or Resource ID',
			description: 'Required for a staff member or resource. Use List Staff or List Resources.',
			required: false,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			required: false,
			options: { disabled: false, options: OVERRIDE_TYPE_OPTIONS },
		}),
		fromTime: Property.ShortText({
			displayName: 'From',
			description: 'Start of the range, e.g. "01-Dec-2026".',
			required: false,
		}),
		toTime: Property.ShortText({
			displayName: 'To',
			description: 'End of the range, e.g. "31-Dec-2026". Requires From.',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number, starting at 1. Defaults to 1.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		if (propsValue.availabilityFor !== 'business' && !propsValue.availabilityForId) {
			throw new Error('Staff or Resource ID is required unless Applies To is Business.');
		}
		const page = propsValue.page ?? 1;
		const result = await zohoBookingsApi.listDateOverrides({ auth, ...propsValue, page });
		const overrides = Array.isArray(result.overrides) ? result.overrides : [];
		return {
			overrides,
			count: overrides.length,
			page,
			next_page_available: result.next_page_available ?? false,
		};
	},
});
