import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoDeveloperAuth } from '../common/auth';
import { DIMO_API_URLS } from '../common/constants';

export const dimoCountVehicles = createAction({
  auth: dimoDeveloperAuth,
  name: 'identity_count_vehicles',
  displayName: 'Count DIMO Vehicles',
  description: 'Get the total number of vehicles registered on the DIMO network. No authentication required.',
  props: {},
  async run(_context) {
    const query = `{
      vehicles {
        totalCount
      }
    }`;

    const response = await httpClient.sendRequest<{ data: { vehicles: { totalCount: number } } }>({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.IDENTITY,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { query },
    });

    return response.body.data;
  },
});

export const dimoGetVehiclesByOwner = createAction({
  auth: dimoDeveloperAuth,
  name: 'identity_get_vehicles_by_owner',
  displayName: 'Get Vehicles by Owner',
  description: 'Get vehicles owned by a specific wallet address. No authentication required.',
  props: {
    owner_address: Property.ShortText({
      displayName: 'Owner Wallet Address',
      description: 'The Ethereum wallet address of the vehicle owner (e.g. 0x1234...).',
      required: true,
    }),
    first: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of vehicles to return (default: 10).',
      required: false,
    }),
  },
  async run(context) {
    const { owner_address, first } = context.propsValue;
    const limit = first ?? 10;

    const query = `{
      vehicles(first: ${limit}, filterBy: { owner: "${owner_address}" }) {
        totalCount
        nodes {
          tokenId
          owner
          mintedAt
          definition {
            make
            model
            year
          }
          dcn {
            name
          }
        }
      }
    }`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.IDENTITY,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { query },
    });

    return response.body;
  },
});

export const dimoGetVehicleById = createAction({
  auth: dimoDeveloperAuth,
  name: 'identity_get_vehicle_by_token_id',
  displayName: 'Get Vehicle by Token ID',
  description: 'Get vehicle identity information by its token ID. No authentication required.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
  },
  async run(context) {
    const { token_id } = context.propsValue;

    const query = `{
      vehicle(tokenId: ${token_id}) {
        tokenId
        owner
        mintedAt
        definition {
          make
          model
          year
        }
        dcn {
          name
        }
        aftermarketDevice {
          tokenId
          address
        }
        syntheticDevice {
          tokenId
          address
        }
      }
    }`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.IDENTITY,
      headers: {
        'Content-Type': 'application/json',
      },
      body: { query },
    });

    return response.body;
  },
});

export const dimoIdentityCustomQuery = createAction({
  auth: dimoDeveloperAuth,
  name: 'identity_custom_query',
  displayName: 'Identity API - Custom GraphQL Query',
  description: 'Execute a custom GraphQL query against the DIMO Identity API. No authentication required. Explore available queries at https://identity-api.dimo.zone/',
  props: {
    query: Property.LongText({
      displayName: 'GraphQL Query',
      description: 'A valid GraphQL query to execute against the Identity API.',
      required: true,
    }),
    variables: Property.Json({
      displayName: 'Variables (optional)',
      description: 'GraphQL variables as a JSON object.',
      required: false,
    }),
  },
  async run(context) {
    const { query, variables } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.IDENTITY,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        query,
        variables: variables ?? {},
      },
    });

    return response.body;
  },
});
