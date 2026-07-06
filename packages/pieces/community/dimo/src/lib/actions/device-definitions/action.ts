import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError, QueryParams } from '@activepieces/pieces-common';
import { dimoAuth } from '../../auth';
import { DimoClient } from '../../common/helpers';

const deviceDefinitionApiAction = createAction({
	auth: dimoAuth,
	name: 'device-definitions-decode-vin',
	displayName: 'Device Definitions : Decode VIN',
	description:
		'Submits a decoding request for vehicle identification number, returns the device definition ID corresponding to the VIN.',
	audience: 'both',
	aiMetadata: { description: 'Decode a VIN (plus its 3-letter ISO country code) into a DIMO device definition ID identifying the make/model/year. A pure lookup that returns the same definition for the same VIN, so it is idempotent; pick it when you have a concrete VIN and need its canonical device definition, versus the Lookup action when you only have free-text make/model/year search terms.', idempotent: true },
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
		const { clientId, apiKey, redirectUri } = context.auth.props;

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
	audience: 'both',
	aiMetadata: { description: 'Search the DIMO device-definition catalog by free-text query plus optional make/model/year filters, with pagination. Read-only search; pick it when you only have descriptive terms (e.g. "Lexus gx 2023") rather than a concrete VIN, in which case use Decode VIN instead.', idempotent: true },
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
		const { clientId, apiKey, redirectUri } = context.auth.props;
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
