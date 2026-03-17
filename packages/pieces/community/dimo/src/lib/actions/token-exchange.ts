import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import { DIMO_API_URLS } from '../common/constants';

export const dimoTokenExchange = createAction({
  auth: dimoDeveloperAuth,
  name: 'token_exchange',
  displayName: 'Exchange Token for Vehicle JWT',
  description: 'Exchange a Developer JWT for a Vehicle JWT to access vehicle-specific data.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle to access.',
      required: true,
    }),
    privileges: Property.Array({
      displayName: 'Privileges',
      description: `Privilege IDs to request:
- 1: Non-Location Data
- 2: Commands (currently paused)
- 3: Current Location
- 4: All-time Location
- 5: VIN credentials`,
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Token Exchange.');
    }

    const privileges = context.propsValue.privileges as number[];
    const tokenId = context.propsValue.token_id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DIMO_API_URLS.TOKEN_EXCHANGE}/v1/tokens/exchange`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
        'Content-Type': 'application/json',
      },
      body: {
        nftContractAddress: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF',
        privileges,
        tokenId,
      },
    });

    return response.body;
  },
});

export const dimoListVehicleTokens = createAction({
  auth: dimoDeveloperAuth,
  name: 'list_vehicle_tokens',
  displayName: 'List Shared Vehicles',
  description: 'List all vehicles that have shared permissions with your developer license.',
  props: {
    wallet_address: Property.ShortText({
      displayName: 'Wallet Address (optional)',
      description: 'Filter vehicles by owner wallet address.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for this action.');
    }

    const walletAddress = context.propsValue.wallet_address;

    // Use Identity API to find vehicles shared with this developer license
    const clientId = auth.client_id;

    let query: string;
    if (walletAddress) {
      query = `{
        vehicles(first: 50, filterBy: { owner: "${walletAddress}" }) {
          totalCount
          nodes {
            tokenId
            owner
            definition {
              make
              model
              year
            }
          }
        }
      }`;
    } else {
      query = `{
        vehicles(first: 50) {
          totalCount
          nodes {
            tokenId
            owner
            definition {
              make
              model
              year
            }
          }
        }
      }`;
    }

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
