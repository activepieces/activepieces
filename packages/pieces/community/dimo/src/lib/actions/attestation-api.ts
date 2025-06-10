import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const attestationApiAction = createAction({
  auth: dimoAuth,
  name: 'attestation_api',
  displayName: 'Attestation API',
  description: 'Generate verifiable proof about vehicle data - currently supports VIN Verifiable Credentials (requires Vehicle JWT)',
  props: {
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
    const { vehicleTokenId, operationType } = context.propsValue;
    
    // Check if Vehicle JWT is provided
    if (!context.auth.vehicleJwt) {
      throw new Error('Vehicle JWT is required for Attestation API. Please provide a Vehicle JWT in the authentication configuration or use the Token Exchange API action first.');
    }

    if (operationType !== 'vin_vc') {
      throw new Error('Currently only VIN Verifiable Credential generation is supported');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://attestation-api.dimo.zone/v1/vc/vin/${vehicleTokenId}`,
        headers: {
          'Authorization': `Bearer ${context.auth.vehicleJwt}`,
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
        usage: {
          description: 'Use the vcQuery on the vcUrl to retrieve the VIN Verifiable Credential',
          example: `
            GraphQL Query: ${vcQuery}
            Endpoint: ${vcUrl}
            
            You can now use this query in the Telemetry API to get the VIN:
            query {
              vinVCLatest(tokenId: ${vehicleTokenId}) {
                rawVC
                vin
              }
            }
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