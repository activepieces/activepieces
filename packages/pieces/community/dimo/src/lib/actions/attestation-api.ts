import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const attestationApiAction = createAction({
  auth: dimoAuth,
  name: 'attestation_api',
  displayName: 'Attestation API',
  description: 'Generate verifiable proof about vehicle data - currently supports VIN Verifiable Credentials (requires Vehicle JWT)',
  props: {
    vehicleJwt: Property.ShortText({
      displayName: 'Vehicle JWT',
      description: 'Vehicle JWT obtained from Token Exchange API (expires in 10 minutes). Leave empty to auto-exchange using settings below.',
      required: false,
    }),
    autoExchange: Property.Checkbox({
      displayName: 'Auto-Exchange for Vehicle JWT',
      description: 'Automatically get Vehicle JWT using Token Exchange API (requires privileges below)',
      required: false,
      defaultValue: false,
    }),
    privileges: Property.StaticMultiSelectDropdown({
      displayName: 'Privileges (for Auto-Exchange)',
      description: 'Required if Auto-Exchange is enabled. VIN credentials require Privilege 5.',
      required: false,
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
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The Vehicle token ID for which to generate the VIN Verifiable Credential',
      required: true,
    }),
    operationType: Property.StaticDropdown({
      displayName: 'Operation Type',
      description: 'Type of verifiable credential to generate',
      required: true,
      defaultValue: 'vin_vc',
      options: {
        options: [
          { label: 'VIN Verifiable Credential', value: 'vin_vc' },
        ],
      },
    }),
  },
  async run(context) {
    const { vehicleJwt, autoExchange, privileges, vehicleTokenId, operationType } = context.propsValue;
    
    let finalVehicleJwt = vehicleJwt;
    
    // Auto-exchange for Vehicle JWT if needed
    if (!finalVehicleJwt && autoExchange) {
      if (!privileges || privileges.length === 0) {
        throw new Error('Privileges are required when Auto-Exchange is enabled. For VIN credentials, you need Privilege 5 (View VIN credentials).');
      }
      
      if (!context.auth.developerJwt) {
        throw new Error('Developer JWT is required for auto-exchange. Please configure it in the connection settings.');
      }
      
      try {
        // Call Token Exchange API internally
        const tokenExchangeResponse = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: 'https://token-exchange-api.dimo.zone/v1/tokens/exchange',
          body: {
            nftContractAddress: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF',
            privileges: privileges,
            tokenId: vehicleTokenId,
          },
          headers: {
            'Authorization': `Bearer ${context.auth.developerJwt}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!tokenExchangeResponse.body.token) {
          throw new Error('Failed to auto-exchange for Vehicle JWT. Please use manual Token Exchange API or provide Vehicle JWT directly.');
        }
        
        finalVehicleJwt = tokenExchangeResponse.body.token;
        
      } catch (error: any) {
        throw new Error(`Auto-exchange failed: ${error.message}. Try using the Token Exchange API action manually.`);
      }
    }
    
    // Check if Vehicle JWT is provided
    if (!finalVehicleJwt) {
      throw new Error('Vehicle JWT is required for Attestation API. Either provide a Vehicle JWT directly, enable Auto-Exchange with privileges, or use the "Token Exchange API" action first.');
    }

    if (operationType !== 'vin_vc') {
      throw new Error('Currently only VIN Verifiable Credential generation is supported');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://attestation-api.dimo.zone/v1/vc/vin/${vehicleTokenId}`,
        headers: {
          'Authorization': `Bearer ${finalVehicleJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired Vehicle JWT. Please use the Token Exchange API to get a fresh Vehicle JWT.');
      }
      
      if (response.status === 400) {
        throw new Error('Bad Request: Invalid vehicle token ID or the vehicle does not have sufficient data to generate a VIN VC.');
      }
      
      if (response.status === 403) {
        throw new Error('Forbidden: Vehicle JWT does not have sufficient privileges to generate attestations for this vehicle.');
      }

      const { vcUrl, vcQuery, message } = response.body;

      return {
        success: true,
        message: message || 'VC generated successfully',
        attestation: {
          vcUrl,
          vcQuery,
          vehicleTokenId,
        },
        autoExchangeUsed: autoExchange && !vehicleJwt,
        usage: {
          description: 'Use the vcQuery on the vcUrl to retrieve the VIN Verifiable Credential',
          example: `
            GraphQL Query: ${vcQuery}
            Endpoint: ${vcUrl}
            
            Note: This verifiable credential can be used to prove vehicle ownership or VIN authenticity to third parties. The VIN data is contained within the verifiable credential itself, not accessible through the Telemetry API.
          `,
        },
        nextSteps: {
          description: 'To retrieve the actual VIN data, use the Telemetry API with the provided query',
          telemetryQuery: vcQuery,
          telemetryEndpoint: vcUrl,
        },
      };
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorBody = error.response.body;
        
        switch (statusCode) {
          case 401:
            throw new Error('Authentication failed: Invalid or expired Vehicle JWT. Please use Token Exchange API to get a fresh Vehicle JWT.');
          case 403:
            throw new Error(`Permission denied: ${errorBody?.message || 'Vehicle JWT does not have sufficient privileges to generate attestations for this vehicle'}`);
          case 400:
            throw new Error(`Bad request: ${errorBody?.message || 'Invalid vehicle token ID or insufficient vehicle data for VIN VC generation'}`);
          case 404:
            throw new Error('Vehicle not found: The specified vehicle token ID does not exist or is not accessible');
          default:
            throw new Error(`Attestation API failed: ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Attestation API request failed: ${error.message}`);
    }
  },
}); 