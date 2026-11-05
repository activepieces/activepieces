import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxSearchAvailablePhoneNumbersAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_search_available_phone_numbers',
	displayName: 'Search Available Phone Numbers',
	description: 'Searches phone numbers available to buy.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches the Telnyx inventory for numbers available to buy, by country, type, area, digits and features, with their monthly and upfront cost. Buy the ones you want with Create Number Order.',
		idempotent: true,
	},
	props: {
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: 'ISO 3166-1 alpha-2 country, e.g. "US".',
			required: false,
		}),
		phoneNumberType: Property.StaticDropdown({
			displayName: 'Number Type',
			description: 'Type of number.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Local', value: 'local' },
					{ label: 'Toll-free', value: 'toll_free' },
					{ label: 'Mobile', value: 'mobile' },
					{ label: 'National', value: 'national' },
					{ label: 'Shared cost', value: 'shared_cost' },
				],
			},
		}),
		locality: Property.ShortText({
			displayName: 'City',
			description: 'City or locality, e.g. "Chicago".',
			required: false,
		}),
		administrativeArea: Property.ShortText({
			displayName: 'State / Region',
			description: 'State or region code, e.g. "IL".',
			required: false,
		}),
		nationalDestinationCode: Property.ShortText({
			displayName: 'Area Code',
			description: 'National destination (area) code, e.g. "312".',
			required: false,
		}),
		rateCenter: Property.ShortText({
			displayName: 'Rate Center',
			description: 'Rate center, e.g. "CHICAGO HEIGHTS".',
			required: false,
		}),
		startsWith: Property.ShortText({
			displayName: 'Starts With',
			description: 'Digits the number starts with (after the country code).',
			required: false,
		}),
		endsWith: Property.ShortText({
			displayName: 'Ends With',
			description: 'Digits the number ends with.',
			required: false,
		}),
		contains: Property.ShortText({
			displayName: 'Contains',
			description: 'Digits the number contains.',
			required: false,
		}),
		feature: Property.StaticDropdown({
			displayName: 'Required Feature',
			description: 'Only return numbers with this feature.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'SMS', value: 'sms' },
					{ label: 'MMS', value: 'mms' },
					{ label: 'Voice', value: 'voice' },
					{ label: 'Fax', value: 'fax' },
					{ label: 'Emergency', value: 'emergency' },
				],
			},
		}),
		limit: Property.Number({
			displayName: 'Limit',
			description: 'Maximum numbers to return. Defaults to the vendor default.',
			required: false,
		}),
		bestEffort: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Best Effort',
			description: 'Whether to include close matches when exact ones are not available.',
		}),
		quickship: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Quickship',
			description: 'Whether to only return numbers that are activated instantly.',
		}),
		reservable: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Reservable',
			description: 'Whether to only return numbers that can be reserved.',
		}),
		excludeHeldNumbers: telnyxAiProps.optionalBoolean({
			required: false,
			displayName: 'Exclude Held Numbers',
			description: 'Whether to exclude numbers held by other customers.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.searchAvailablePhoneNumbers({
			auth: context.auth,
			query: telnyxUtils.toQuery({
				values: {
					'filter[country_code]': p.countryCode,
					'filter[phone_number_type]': p.phoneNumberType,
					'filter[locality]': p.locality,
					'filter[administrative_area]': p.administrativeArea,
					'filter[national_destination_code]': p.nationalDestinationCode,
					'filter[rate_center]': p.rateCenter,
					'filter[phone_number][starts_with]': p.startsWith,
					'filter[phone_number][ends_with]': p.endsWith,
					'filter[phone_number][contains]': p.contains,
					'filter[features]': p.feature,
					'filter[limit]': p.limit,
					'filter[best_effort]': p.bestEffort,
					'filter[quickship]': p.quickship,
					'filter[reservable]': p.reservable,
					'filter[exclude_held_numbers]': p.excludeHeldNumbers,
				},
			}),
		});
	},
});
