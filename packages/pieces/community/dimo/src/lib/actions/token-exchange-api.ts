import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const tokenExchangeApiAction = createAction({
  auth: dimoAuth,
  name: 'token_exchange_api',
  displayName: 'Token Exchange API',
  description: 'Exchange Developer JWT for short-lived Vehicle JWT (10 minutes) to access vehicle-specific data like Telemetry. Users must share permissions with your app for this to work.',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The Vehicle ID (integer) that you are requesting permission to access. This identifies the specific vehicle you want to query data for.',
      required: true,
    }),
    privileges: Property.StaticMultiSelectDropdown({
      displayName: 'Privileges (Permissions)',
      description: 'Select the permissions you need for the Vehicle JWT.',
      required: true,
      options: {
        options: [
          { label: 'All-time, non-location data (Privilege 1)', value: 1 },
          { label: 'Commands (Privilege 2)', value: 2 },
          { label: 'Current location (Privilege 3)', value: 3 },
          { label: 'All-time location (Privilege 4)', value: 4 },
          { label: 'View VIN credentials (Privilege 5)', value: 5 },
          { label: 'Live data streams (Privilege 6)', value: 6 },
          { label: 'Raw data (Privilege 7)', value: 7 },
          { label: 'Approximate location (Privilege 8)', value: 8 }
        ],
      },
    }),
    nftContractAddress: Property.ShortText({
      displayName: 'NFT Contract Address',
      description: 'Vehicle NFT contract address. In Production environment, this should always be the default value.',
      required: true,
      defaultValue: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF',
    }),
  },
  
  async run(context) {
    const { vehicleTokenId, privileges, nftContractAddress } = context.propsValue;
    
    // Check if Developer JWT is provided
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for Token Exchange API. Please configure it in the connection settings using a JWT from console.dimo.org.');
    }

    // Validate privileges array
    if (!privileges || (Array.isArray(privileges) && privileges.length === 0)) {
      throw new Error('At least one privilege must be selected to exchange for a Vehicle JWT.');
    }

    // Convert single privilege to array format
    const privilegesArray = Array.isArray(privileges) ? privileges : [privileges];
    
    // Validate privilege values are in valid range (1-8)
    const invalidPrivileges = privilegesArray.filter(p => p < 1 || p > 8);
    if (invalidPrivileges.length > 0) {
      throw new Error(`Invalid privilege values: ${invalidPrivileges.join(', ')}. Privileges must be integers between 1 and 8.`);
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://token-exchange-api.dimo.zone/v1/tokens/exchange',
        body: {
          nftContractAddress,
          privileges: privilegesArray,
          tokenId: vehicleTokenId,
        },
        headers: {
          'Authorization': `Bearer ${context.auth.developerJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired Developer JWT. Please check your JWT from console.dimo.org.');
      }
      
      if (response.status === 403) {
        throw new Error('Forbidden: Either the vehicle does not exist, you do not have permission to access this vehicle, or the user has not shared the requested privileges with your app.');
      }

      if (!response.body.token) {
        throw new Error('Token exchange failed: No Vehicle JWT returned in response. This may indicate an issue with the DIMO Token Exchange service.');
      }

      // Decode the JWT to extract useful information
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
        // If JWT decoding fails, we still return the token but without decoded info
        console.warn('Could not decode Vehicle JWT payload for additional metadata');
      }

      return {
        vehicleJwt: response.body.token,
        tokenMetadata: decodedToken,
        expirationInfo: {
          expiresInMinutes: 10,
          warning: 'Vehicle JWTs are short-lived (10 minutes). Implement retry logic for token refresh.',
          recommendation: 'Decode the JWT to get the exact expiration timestamp (exp field) for precise timing.',
        },
        usage: {
          description: 'Use this Vehicle JWT in Authorization header for vehicle-specific API calls',
          authorizationHeader: `Bearer ${response.body.token}`,
          compatibleApis: [
            'Telemetry API - Access vehicle sensor data',
            'Attestation API - Vehicle verification data',
            'Other vehicle-scoped endpoints'
          ],
        },
        requestSummary: {
          vehicleTokenId,
          privilegesGranted: privilegesArray,
          nftContractAddress,
          privilegeDescriptions: privilegesArray.map(p => {
            const descriptions = {
              1: 'All-time, non-location data',
              2: 'Commands',
              3: 'Current location',
              4: 'All-time location', 
              5: 'View VIN credentials',
              6: 'Live data streams',
              7: 'Raw data',
              8: 'Approximate location'
            };
            return `${p}: ${descriptions[p as keyof typeof descriptions]}`;
          }),
        },
      };
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorBody = error.response.body;
        
        switch (statusCode) {
          case 401:
            throw new Error('Authentication failed: Invalid or expired Developer JWT. Please obtain a fresh JWT from console.dimo.org > Webhooks > Generate JWT.');
          case 403:
            throw new Error(`Permission denied: ${errorBody?.message || 'The user has not shared the requested privileges with your app, or you do not have access to this vehicle. Ensure the vehicle owner has granted permissions to your Developer License.'}`);
          case 400:
            throw new Error(`Bad request: ${errorBody?.message || 'Invalid request parameters. Check that vehicleTokenId is a valid integer and privileges are between 1-8.'}`);
          case 404:
            throw new Error(`Vehicle not found: Vehicle with tokenId ${vehicleTokenId} does not exist or is not accessible.`);
          default:
            throw new Error(`Token exchange failed (HTTP ${statusCode}): ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Token Exchange API request failed: ${error.message}`);
    }
  },
}); 