import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError, QueryParams } from '@activepieces/pieces-common';
import { dimoAuth } from '../../../index';
import { DimoClient } from '../../common/helpers';

const deviceDefinitionApiAction = createAction({
	auth: dimoAuth,
	name: 'device-definitions-decode-vin',
	displayName: 'Device Definitions : Decode VIN',
	description:
		'Submits a decoding request for vehicle identification number, returns the device definition ID corresponding to the VIN.',
	props: {
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: '3-letter ISO 3166-1 alpha-3 country code (e.g. USA)',
			required: true,
		}),
		vin: Property.ShortText({
			displayName: 'VIN',
			description: 'Vehicle Identification Number.',
			required: true,
		}),
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;

		const { countryCode, vin } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});
		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const response = await dimo.decodeVin({ developerJwt, vin, countryCode });

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

const deviceDefinitionsSearchAction = createAction({
	auth: dimoAuth,
	name: 'device-definitions-lookup-device-definitions',
	displayName: 'Device Definitions : Lookup',
	description: 'Search for device definitions by query and filters.',
	props: {
		query: Property.ShortText({
			displayName: 'Query',
			description: 'Query filter (e.g. Lexus gx 2023)',
			required: true,
		}),
		makeSlug: Property.ShortText({
			displayName: 'Vehicle Make',
			description: 'Make of the vehicle (e.g. audi, lexus, etc)',
			required: false,
		}),
		modelSlug: Property.ShortText({
			displayName: 'Vehicle Model',
			description: 'Model of the vehicle (e.g. Tacoma, Accord, etc)',
			required: false,
		}),
		year: Property.Number({
			displayName: 'Vehicle Year',
			description: 'Year of the vehicle (e.g. 2024)',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Page number (for pagination, defaults to 1)',
			required: false,
		}),
		pageSize: Property.Number({
			displayName: 'Page Size',
			description: 'Page size (items per page)',
			required: false,
		}),
	},
	async run(context) {
		const { clientId, apiKey, redirectUri } = context.auth;
		const { query, makeSlug, modelSlug, year, page, pageSize } = context.propsValue;

		const dimo = new DimoClient({
			clientId,
			apiKey,
			redirectUri,
		});

		try {
			const developerJwt = await dimo.getDeveloperJwt();

			const params: QueryParams = {};
			params['query'] = query;
			if (makeSlug) params['makeSlug'] = makeSlug;
			if (modelSlug) params['modelSlug'] = modelSlug;
			if (year) params['year'] = year.toString();
			if (page) params['page'] = page.toString();
			if (pageSize) params['pageSize'] = pageSize.toString();

			const response = await dimo.deviceSearch({ developerJwt, params });

			return response;
		} catch (err) {
			const message = (err as HttpError).message;
			throw new Error(message);
		}
	},
});

export const deviceDefinitionApiActions = [
	deviceDefinitionApiAction,
	deviceDefinitionsSearchAction,
];
