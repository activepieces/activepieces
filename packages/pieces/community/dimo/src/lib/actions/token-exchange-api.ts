import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const tokenExchangeApiAction = createAction({
  auth: dimoAuth,
  name: 'token_exchange_api',
  displayName: 'Token Exchange API',
  description: 'Exchange Developer JWT for Vehicle JWT to access specific vehicle data (requires Developer JWT)',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The Vehicle ID that you are requesting permission to access',
      required: true,
    }),
    privileges: Property.StaticMultiSelectDropdown({
      displayName: 'Privileges',
      description: 'Select the permissions you need for the Vehicle JWT',
      required: true,
      options: {
        options: [
          { label: 'All-time, non-location data (1)', value: 1 },
          { label: 'Commands (2)', value: 2 },
          { label: 'Current location (3)', value: 3 },
          { label: 'All-time location (4)', value: 4 },
          { label: 'View VIN credentials (5)', value: 5 },
          { label: 'Live data streams (6)', value: 6 },
          { label: 'Raw data (7)', value: 7 },
          { label: 'Approximate location (8)', value: 8 },
        ],
      },
    }),
    nftContractAddress: Property.ShortText({
      displayName: 'NFT Contract Address',
      description: 'Vehicle NFT contract address',
      required: true,
      defaultValue: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF',
    }),
  },
  async run(context) {
    const { vehicleTokenId, privileges, nftContractAddress } = context.propsValue;
    
    // Check if Developer JWT is provided
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for Token Exchange API. Please provide a Developer JWT in the authentication configuration.');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://token-exchange-api.dimo.zone/v1/tokens/exchange',
        body: {
          nftContractAddress,
          privileges: Array.isArray(privileges) ? privileges : [privileges],
          tokenId: vehicleTokenId,
        },
        headers: {
          'Authorization': `Bearer ${context.auth.developerJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired Developer JWT');
      }
      
      if (response.status === 403) {
        throw new Error('Forbidden: Developer does not have permission to access this vehicle or the requested privileges');
      }

      if (!response.body.token) {
        throw new Error('Token exchange failed: No token returned in response');
      }

      // Decode the JWT to get expiration info
      let decodedToken = null;
      try {
        const tokenParts = response.body.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          decodedToken = {
            tokenId: payload.token_id,
            contractAddress: payload.contract_address,
            privilegeIds: payload.privilege_ids,
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
            issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : null,
            issuer: payload.iss,
            subject: payload.sub,
          };
        }
      } catch (decodeError) {
        // If decoding fails, we still return the token
        console.warn('Could not decode Vehicle JWT for additional info');
      }

      return {
        vehicleJwt: response.body.token,
        tokenInfo: decodedToken,
        expiresInMinutes: 10, // Vehicle JWTs expire in 10 minutes
        usage: {
          description: 'Use this Vehicle JWT in the Authorization header as "Bearer <token>" for Telemetry API, Attestation API, and other vehicle-specific endpoints',
          example: `Authorization: Bearer ${response.body.token}`,
        },
        requestDetails: {
          vehicleTokenId,
          privileges: Array.isArray(privileges) ? privileges : [privileges],
          nftContractAddress,
        },
      };
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorBody = error.response.body;
        
        switch (statusCode) {
          case 401:
            throw new Error('Authentication failed: Invalid or expired Developer JWT');
          case 403:
            throw new Error(`Permission denied: ${errorBody?.message || 'Developer does not have permission to access this vehicle or the requested privileges'}`);
          case 400:
            throw new Error(`Bad request: ${errorBody?.message || 'Invalid request parameters'}`);
          default:
            throw new Error(`Token exchange failed: ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Token Exchange API request failed: ${error.message}`);
    }
  },
}); 