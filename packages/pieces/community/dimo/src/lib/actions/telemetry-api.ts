import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const telemetryApiAction = createAction({
  auth: dimoAuth,
  name: 'telemetry_api',
  displayName: 'Telemetry API (GraphQL)',
  description: 'Access vehicle sensor and telemetry data using GraphQL (requires Vehicle JWT)',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The Vehicle ID to query telemetry data for',
      required: true,
    }),
    queryType: Property.StaticDropdown({
      displayName: 'Query Type',
      description: 'Choose between latest data or historical data with aggregation',
      required: true,
      defaultValue: 'latest',
      options: {
        options: [
          { label: 'Latest Signals (Most Recent Data)', value: 'latest' },
          { label: 'Historical Signals (Time Range with Aggregation)', value: 'historical' },
          { label: 'Available Signals (List Queryable Fields)', value: 'available' },
          { label: 'Custom GraphQL Query', value: 'custom' },
        ],
      },
    }),
    // For historical queries
    fromDate: Property.DateTime({
      displayName: 'From Date',
      description: 'Start date for historical data (ISO format: 2024-05-07T09:21:19Z)',
      required: false,
    }),
    toDate: Property.DateTime({
      displayName: 'To Date', 
      description: 'End date for historical data (ISO format: 2024-05-10T09:21:19Z)',
      required: false,
    }),
    interval: Property.ShortText({
      displayName: 'Interval',
      description: 'Time span for aggregation (e.g., 1h, 24h, 300ms, 2h45m)',
      required: false,
      defaultValue: '1h',
    }),
    // Signal selection
    signals: Property.StaticMultiSelectDropdown({
      displayName: 'Signals to Query',
      description: 'Select which vehicle signals you want to retrieve',
      required: false,
      options: {
        options: [
          // Basic Vehicle Data
          { label: 'Speed (km/hr)', value: 'speed' },
          { label: 'Ignition Status', value: 'isIgnitionOn' },
          { label: 'Odometer (km)', value: 'powertrainTransmissionTravelledDistance' },
          { label: 'Range Remaining (meters)', value: 'powertrainRange' },
          { label: 'VIN Number', value: 'vinVC' },
          
          // Location (requires location privileges)
          { label: 'Current Latitude', value: 'currentLocationLatitude' },
          { label: 'Current Longitude', value: 'currentLocationLongitude' },
          { label: 'Current Altitude', value: 'currentLocationAltitude' },
          { label: 'Approximate Latitude', value: 'currentLocationApproximateLatitude' },
          { label: 'Approximate Longitude', value: 'currentLocationApproximateLongitude' },
          
          // Battery & Charging
          { label: 'Battery Current Power (watts)', value: 'powertrainTractionBatteryCurrentPower' },
          { label: 'Battery Charge Level (%)', value: 'powertrainTractionBatteryStateOfChargeCurrent' },
          { label: 'Battery Remaining Energy (kWh)', value: 'powertrainTractionBatteryStateOfChargeCurrentEnergy' },
          { label: 'Is Charging', value: 'powertrainTractionBatteryChargingIsCharging' },
          { label: 'Charge Limit (%)', value: 'powertrainTractionBatteryChargingChargeLimit' },
          { label: 'Battery Total Capacity (kWh)', value: 'powertrainTractionBatteryGrossCapacity' },
          
          // Fuel System
          { label: 'Fuel Level (%)', value: 'powertrainFuelSystemRelativeLevel' },
          { label: 'Fuel Level (liters)', value: 'powertrainFuelSystemAbsoluteLevel' },
          { label: 'Supported Fuel Types', value: 'powertrainFuelSystemSupportedFuelTypes' },
          
          // Tire Pressure
          { label: 'Front Left Tire Pressure (kPa)', value: 'chassisAxleRow1WheelLeftTirePressure' },
          { label: 'Front Right Tire Pressure (kPa)', value: 'chassisAxleRow1WheelRightTirePressure' },
          { label: 'Rear Left Tire Pressure (kPa)', value: 'chassisAxleRow2WheelLeftTirePressure' },
          { label: 'Rear Right Tire Pressure (kPa)', value: 'chassisAxleRow2WheelRightTirePressure' },
          
          // Engine & Powertrain
          { label: 'Engine RPM', value: 'powertrainCombustionEngineSpeed' },
          { label: 'Engine Load (%)', value: 'obdEngineLoad' },
          { label: 'Engine Coolant Temperature (°C)', value: 'powertrainCombustionEngineECT' },
          { label: 'Throttle Position (%)', value: 'powertrainCombustionEngineTPS' },
          { label: 'Oil Level', value: 'powertrainCombustionEngineEngineOilLevel' },
          
          // Environment
          { label: 'Exterior Air Temperature (°C)', value: 'exteriorAirTemperature' },
          
          // Doors & Windows
          { label: 'Front Driver Door Open', value: 'cabinDoorRow1DriverSideIsOpen' },
          { label: 'Front Passenger Door Open', value: 'cabinDoorRow1PassengerSideIsOpen' },
          { label: 'Front Driver Window Open', value: 'cabinDoorRow1DriverSideWindowIsOpen' },
          { label: 'Front Passenger Window Open', value: 'cabinDoorRow1PassengerSideWindowIsOpen' },
        ],
      },
    }),
    aggregationType: Property.StaticDropdown({
      displayName: 'Aggregation Type',
      description: 'How to aggregate data for historical queries',
      required: false,
      defaultValue: 'AVG',
      options: {
        options: [
          { label: 'Average (AVG)', value: 'AVG' },
          { label: 'Maximum (MAX)', value: 'MAX' },
          { label: 'Minimum (MIN)', value: 'MIN' },
          { label: 'Median (MED)', value: 'MED' },
          { label: 'Random Sample (RAND)', value: 'RAND' },
        ],
      },
    }),
    sourceFilter: Property.StaticDropdown({
      displayName: 'Data Source Filter',
      description: 'Filter signals by data source (optional)',
      required: false,
      options: {
        options: [
          { label: 'All Sources', value: '' },
          { label: 'AutoPi Device', value: 'autopi' },
          { label: 'Macaron Device', value: 'macaron' },
          { label: 'Ruptela Device', value: 'ruptela' },
          { label: 'Smartcar Integration', value: 'smartcar' },
          { label: 'Tesla Integration', value: 'tesla' },
        ],
      },
    }),
    customQuery: Property.LongText({
      displayName: 'Custom GraphQL Query',
      description: 'Enter your custom GraphQL query for advanced use cases',
      required: false,
    }),
  },
  async run(context) {
    const { 
      vehicleTokenId, 
      queryType, 
      fromDate, 
      toDate, 
      interval, 
      signals, 
      aggregationType, 
      sourceFilter,
      customQuery 
    } = context.propsValue;
    
    // Check if Vehicle JWT is provided
    if (!context.auth.vehicleJwt) {
      throw new Error('Vehicle JWT is required for Telemetry API. Please provide a Vehicle JWT in the authentication configuration or use the Token Exchange API action first.');
    }

    let graphqlQuery = '';
    
    switch (queryType) {
      case 'custom':
        if (!customQuery) {
          throw new Error('Custom GraphQL query is required when Query Type is "Custom GraphQL Query"');
        }
        graphqlQuery = customQuery;
        break;
        
      case 'available':
        graphqlQuery = `
          query GetAvailableSignals {
            availableSignals(tokenId: ${vehicleTokenId})
          }`;
        break;
        
      case 'latest':
        if (!signals || signals.length === 0) {
          throw new Error('At least one signal must be selected for latest data query');
        }
        
        const latestSignalFields = signals.map(signal => {
          return `${signal} {
            value
            timestamp
          }`;
        }).join('\n    ');
        
        const filterClause = sourceFilter ? `, filter: { source: "${sourceFilter}" }` : '';
        
        graphqlQuery = `
          query GetLatestSignals {
            signalsLatest(tokenId: ${vehicleTokenId}${filterClause}) {
              lastSeen
              ${latestSignalFields}
            }
          }`;
        break;
        
      case 'historical':
        if (!fromDate || !toDate) {
          throw new Error('From Date and To Date are required for historical data query');
        }
        if (!signals || signals.length === 0) {
          throw new Error('At least one signal must be selected for historical data query');
        }
        
        const historicalSignalFields = signals.map(signal => {
          return `${signal}(agg: ${aggregationType || 'AVG'})`;
        }).join('\n    ');
        
        const historicalFilterClause = sourceFilter ? `, filter: { source: "${sourceFilter}" }` : '';
        
        graphqlQuery = `
          query GetHistoricalSignals {
            signals(
              tokenId: ${vehicleTokenId}
              from: "${fromDate}"
              to: "${toDate}"
              interval: "${interval || '1h'}"${historicalFilterClause}
            ) {
              timestamp
              ${historicalSignalFields}
            }
          }`;
        break;
        
      default:
        throw new Error('Invalid query type selected');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://telemetry-api.dimo.zone/query',
        body: {
          query: graphqlQuery,
        },
        headers: {
          'Authorization': `Bearer ${context.auth.vehicleJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired Vehicle JWT. Please use the Token Exchange API to get a fresh Vehicle JWT.');
      }
      
      if (response.status === 403) {
        throw new Error('Forbidden: Vehicle JWT does not have sufficient privileges for the requested data. Check your permissions.');
      }

      if (response.body.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
      }

      return {
        data: response.body.data,
        queryInfo: {
          vehicleTokenId,
          queryType,
          signalsRequested: signals,
          aggregationType: queryType === 'historical' ? aggregationType : null,
          timeRange: queryType === 'historical' ? { from: fromDate, to: toDate, interval } : null,
          sourceFilter: sourceFilter || 'all',
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
            throw new Error(`Permission denied: ${errorBody?.message || 'Vehicle JWT does not have sufficient privileges for the requested telemetry data'}`);
          case 400:
            throw new Error(`Bad request: ${errorBody?.message || 'Invalid query parameters or GraphQL syntax'}`);
          default:
            throw new Error(`Telemetry API failed: ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Telemetry API request failed: ${error.message}`);
    }
  },
}); 