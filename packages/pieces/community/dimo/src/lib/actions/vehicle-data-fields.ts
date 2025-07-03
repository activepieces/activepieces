import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const vehicleDataFieldsAction = createAction({
  auth: dimoAuth,
  name: 'vehicle_data_fields',
  displayName: 'Vehicle Data Fields Lookup',
  description: 'Look up available data fields for a given vehicle (requires Vehicle JWT)',
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
      description: 'Required if Auto-Exchange is enabled. Data fields lookup requires Privilege 1 or 6.',
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
      description: 'The Vehicle token ID to look up available data fields for',
      required: true,
    }),
  },
  async run(context) {
    const { vehicleJwt, autoExchange, privileges, vehicleTokenId } = context.propsValue;
    
    let finalVehicleJwt = vehicleJwt;
    
    // Auto-exchange for Vehicle JWT if needed
    if (!finalVehicleJwt && autoExchange) {
      if (!privileges || privileges.length === 0) {
        throw new Error('Privileges are required when Auto-Exchange is enabled. For data fields lookup, recommend Privilege 1 (All-time, non-location data) or Privilege 6 (Live data streams).');
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
    
    if (!finalVehicleJwt) {
      throw new Error('Vehicle JWT is required for Vehicle Data Fields lookup. Either provide a Vehicle JWT directly, enable Auto-Exchange with privileges, or use the "Token Exchange API" action first.');
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
          'Authorization': `Bearer ${finalVehicleJwt}`,
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
        autoExchangeUsed: autoExchange && !vehicleJwt,
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