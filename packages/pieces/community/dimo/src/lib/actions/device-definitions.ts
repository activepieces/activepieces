import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import { DIMO_API_URLS } from '../common/constants';

export const dimoSearchDeviceDefinitions = createAction({
  auth: dimoDeveloperAuth,
  name: 'device_definitions_search',
  displayName: 'Search Device Definitions',
  description: 'Search for vehicle device definitions by make, model, or query. Requires Developer JWT.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'General search term (e.g. "Toyota Camry 2022").',
      required: false,
    }),
    make_slug: Property.ShortText({
      displayName: 'Make Slug',
      description: 'Vehicle make slug (e.g. "toyota", "ford").',
      required: false,
    }),
    model_slug: Property.ShortText({
      displayName: 'Model Slug',
      description: 'Vehicle model slug (e.g. "camry", "f-150").',
      required: false,
    }),
    year: Property.Number({
      displayName: 'Year',
      description: 'Vehicle model year (e.g. 2022).',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1).',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results per page (default: 10).',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Device Definitions API calls.');
    }

    const { query, make_slug, model_slug, year, page, page_size } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (query) queryParams['query'] = query;
    if (make_slug) queryParams['makeSlug'] = make_slug;
    if (model_slug) queryParams['modelSlug'] = model_slug;
    if (year) queryParams['year'] = String(year);
    if (page) queryParams['page'] = String(page);
    if (page_size) queryParams['pageSize'] = String(page_size);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DIMO_API_URLS.DEVICE_DEFINITIONS}/v1/device-definitions/search`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
      },
      queryParams,
    });

    return response.body;
  },
});

export const dimoGetDeviceDefinitionById = createAction({
  auth: dimoDeveloperAuth,
  name: 'device_definitions_get_by_id',
  displayName: 'Get Device Definition by ID',
  description: 'Get a specific device definition by its ID. Requires Developer JWT.',
  props: {
    definition_id: Property.ShortText({
      displayName: 'Device Definition ID',
      description: 'The unique identifier of the device definition.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Device Definitions API calls.');
    }

    const { definition_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DIMO_API_URLS.DEVICE_DEFINITIONS}/v1/device-definitions/${definition_id}`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
      },
    });

    return response.body;
  },
});

export const dimoDecodeVin = createAction({
  auth: dimoDeveloperAuth,
  name: 'device_definitions_decode_vin',
  displayName: 'Decode VIN',
  description: 'Decode a Vehicle Identification Number (VIN) to get vehicle details. Requires Developer JWT.',
  props: {
    vin: Property.ShortText({
      displayName: 'VIN',
      description: 'The 17-character Vehicle Identification Number to decode.',
      required: true,
    }),
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Country code for the VIN (e.g. "US").',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Device Definitions API calls.');
    }

    const { vin, country_code } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (country_code) queryParams['countryCode'] = country_code;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DIMO_API_URLS.DEVICE_DEFINITIONS}/v1/device-definitions/decode-vin/${vin}`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
      },
      queryParams,
    });

    return response.body;
  },
});
