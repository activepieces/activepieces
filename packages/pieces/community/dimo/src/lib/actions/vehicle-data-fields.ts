import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const vehicleDataFieldsAction = createAction({
  auth: dimoAuth,
  name: 'vehicle_data_fields',
  displayName: 'Vehicle Data Fields Lookup',
  description: 'Look up available data fields for a given vehicle (requires Vehicle JWT)',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The Vehicle token ID to look up available data fields for',
      required: true,
    }),
  },
  async run(context) {
    const { vehicleTokenId } = context.propsValue;
    
    if (!context.auth.vehicleJwt) {
      throw new Error('Vehicle JWT is required for Vehicle Data Fields lookup. Please provide a Vehicle JWT in the authentication configuration or use the Token Exchange API action first.');
    }

    try {
      // Use the Telemetry API to get available signals for the vehicle
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://telemetry-api.dimo.zone/query',
        body: {
          query: `
            query GetAvailableSignals {
              availableSignals(tokenId: ${vehicleTokenId})
            }
          `,
        },
        headers: {
          'Authorization': `Bearer ${context.auth.vehicleJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.body.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
      }

      const availableSignals = response.body.data.availableSignals;

      return {
        vehicleTokenId,
        availableSignals,
        totalSignals: availableSignals.length,
        signalCategories: {
          basic: availableSignals.filter((s: string) => ['speed', 'isIgnitionOn', 'powertrainTransmissionTravelledDistance'].includes(s)),
          location: availableSignals.filter((s: string) => s.includes('Location')),
          battery: availableSignals.filter((s: string) => s.includes('Battery') || s.includes('Charging')),
          fuel: availableSignals.filter((s: string) => s.includes('Fuel')),
          tire: availableSignals.filter((s: string) => s.includes('Tire')),
          engine: availableSignals.filter((s: string) => s.includes('Engine') || s.includes('obd')),
          doors: availableSignals.filter((s: string) => s.includes('Door') || s.includes('Window')),
        },
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid or expired Vehicle JWT. Please use Token Exchange API to get a fresh Vehicle JWT.');
      }
      throw new Error(`Vehicle Data Fields lookup failed: ${error.message}`);
    }
  },
}); 