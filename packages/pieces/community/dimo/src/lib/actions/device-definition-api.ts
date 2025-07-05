import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const deviceDefinitionApiAction = createAction({
  auth: dimoAuth,
  name: 'device_definition_api',
  displayName: 'Device Definitions API',
  description: 'Helper functions for Device Definitions - VIN decoding and device search (requires Developer JWT)',
  props: {
    operation: Property.StaticDropdown({
      displayName: 'Operation',
      description: 'Choose the Device Definitions operation to perform',
      required: true,
      defaultValue: 'search',
      options: {
        options: [
          { label: 'Search Device Definitions', value: 'search' },
          { label: 'Decode VIN', value: 'decode-vin' },
        ],
      },
    }),
    // Search operation parameters
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Query filter (e.g., "Lexus GX 2023")',
      required: false,
    }),
    makeSlug: Property.ShortText({
      displayName: 'Make Slug',
      description: 'Make of the vehicle (e.g., "audi", "lexus", "toyota")',
      required: false,
    }),
    modelSlug: Property.ShortText({
      displayName: 'Model Slug',
      description: 'Model of the vehicle (e.g., "tacoma", "accord", "camry")',
      required: false,
    }),
    year: Property.Number({
      displayName: 'Year',
      description: 'Year of the vehicle (e.g., 2024)',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page Number',
      description: 'Page number for pagination (defaults to 1)',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Items to show per page (defaults to 20)',
      required: false,
      defaultValue: 20,
    }),
    // VIN decode operation parameters
    vin: Property.ShortText({
      displayName: 'VIN',
      description: 'Vehicle Identification Number (e.g., "1HGCM66886A015965")',
      required: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: '3-letter ISO 3166-1 alpha-3 country code (e.g., "USA")',
      required: false,
      defaultValue: 'USA',
    }),
  },
  async run(context) {
    const { 
      operation, 
      query, 
      makeSlug, 
      modelSlug, 
      year, 
      page, 
      pageSize, 
      vin, 
      countryCode 
    } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for Device Definitions API. Please configure it in the connection settings.');
    }

    try {
      if (operation === 'search') {
        // Build query parameters for search
        const searchParams = new URLSearchParams();
        if (query) searchParams.append('query', query);
        if (makeSlug) searchParams.append('makeSlug', makeSlug);
        if (modelSlug) searchParams.append('modelSlug', modelSlug);
        if (year) searchParams.append('year', year.toString());
        if (page) searchParams.append('page', page.toString());
        if (pageSize) searchParams.append('pageSize', pageSize.toString());

        const queryString = searchParams.toString();
        const url = `https://device-definitions-api.dimo.zone/device-definitions/search${queryString ? '?' + queryString : ''}`;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: url,
          headers: {
            'Authorization': `Bearer ${context.auth.developerJwt}`,
          },
        });

        return {
          operation: 'search',
          deviceDefinitions: response.body.deviceDefinitions || [],
          facets: response.body.facets || {},
          pagination: response.body.pagination || {},
          searchParams: Object.fromEntries(searchParams),
        };

      } else if (operation === 'decode-vin') {
        if (!vin) {
          throw new Error('VIN is required for decode-vin operation');
        }

        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: 'https://device-definitions-api.dimo.zone/device-definitions/decode-vin',
          body: {
            vin: vin,
            countryCode: countryCode || 'USA',
          },
          headers: {
            'Authorization': `Bearer ${context.auth.developerJwt}`,
            'Content-Type': 'application/json',
          },
        });

        return {
          operation: 'decode-vin',
          deviceDefinitionId: response.body.deviceDefinitionId,
          newTransactionHash: response.body.newTransactionHash,
          vin: vin,
          countryCode: countryCode || 'USA',
        };

      } else {
        throw new Error('Invalid operation selected');
      }

    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorBody = error.response.body;
        
        switch (statusCode) {
          case 404:
            throw new Error(`Not Found: ${errorBody?.message || 'Device definition not found for the provided parameters'}`);
          case 500:
            throw new Error(`Internal Server Error: ${errorBody?.message || 'DIMO server error occurred'}`);
          default:
            throw new Error(`Device Definitions API failed: ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Device Definitions API request failed: ${error.message}`);
    }
  },
}); 