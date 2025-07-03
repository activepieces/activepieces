import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const telemetryApiAction = createAction({
  auth: dimoAuth,
  name: 'telemetry_api',
  displayName: 'Telemetry API (GraphQL)',
  description: 'Access vehicle sensor and telemetry data using GraphQL (requires Vehicle JWT from Token Exchange)',
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
      description: 'Required if Auto-Exchange is enabled',
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
      description: 'The Vehicle ID to query telemetry data for',
      required: true,
    }),
    queryType: Property.StaticDropdown({
      displayName: 'Query Type',
      description: 'Choose between latest data, historical data, available signals, or custom query',
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
    
    // Signal selection
    signals: Property.StaticMultiSelectDropdown({
      displayName: 'Signals to Query',
      description: 'Select which vehicle signals you want to retrieve',
      required: false,
      options: {
        options: [
          // Basic Vehicle Signals
          { label: 'Last Seen (timestamp)', value: 'lastSeen' },
          { label: 'Speed (km/hr)', value: 'speed' },
          { label: 'Ignition Status (0/1)', value: 'isIgnitionOn' },
          { label: 'Odometer (km)', value: 'powertrainTransmissionTravelledDistance' },
          { label: 'Range Remaining (meters)', value: 'powertrainRange' },
          { label: 'Powertrain Type', value: 'powertrainType' },
          
          // Location Signals (require location privileges)
          { label: 'Current Latitude (degrees)', value: 'currentLocationLatitude' },
          { label: 'Current Longitude (degrees)', value: 'currentLocationLongitude' },
          { label: 'Current Altitude (degrees)', value: 'currentLocationAltitude' },
          { label: 'Approximate Latitude (degrees)', value: 'currentLocationApproximateLatitude' },
          { label: 'Approximate Longitude (degrees)', value: 'currentLocationApproximateLongitude' },
          { label: 'Location Is Redacted (0/1)', value: 'currentLocationIsRedacted' },
          
          // Battery & Charging Signals
          { label: 'Battery Current Power (watts)', value: 'powertrainTractionBatteryCurrentPower' },
          { label: 'Battery Charge Level (%)', value: 'powertrainTractionBatteryStateOfChargeCurrent' },
          { label: 'Battery Remaining Energy (kWh)', value: 'powertrainTractionBatteryStateOfChargeCurrentEnergy' },
          { label: 'Battery Gross Capacity (kWh)', value: 'powertrainTractionBatteryGrossCapacity' },
          { label: 'Is Charging (0/1)', value: 'powertrainTractionBatteryChargingIsCharging' },
          { label: 'Charge Limit (%)', value: 'powertrainTractionBatteryChargingChargeLimit' },
          { label: 'AC Charging Current (amps)', value: 'powertrainTractionBatteryChargingChargeCurrentAC' },
          { label: 'Charging Voltage (volts)', value: 'powertrainTractionBatteryChargingChargeVoltageUnknownType' },
          { label: 'Session Energy Added (kWh)', value: 'powertrainTractionBatteryChargingAddedEnergy' },
          { label: 'Low Voltage Battery (volts)', value: 'lowVoltageBatteryCurrentVoltage' },
          
          // Fuel System Signals
          { label: 'Fuel Level (%)', value: 'powertrainFuelSystemRelativeLevel' },
          { label: 'Fuel Level (liters)', value: 'powertrainFuelSystemAbsoluteLevel' },
          { label: 'Supported Fuel Types', value: 'powertrainFuelSystemSupportedFuelTypes' },
          
          // Engine & Powertrain Signals
          { label: 'Engine RPM', value: 'powertrainCombustionEngineSpeed' },
          { label: 'Engine Load (%)', value: 'obdEngineLoad' },
          { label: 'Engine Coolant Temperature (°C)', value: 'powertrainCombustionEngineECT' },
          { label: 'Throttle Position (%)', value: 'powertrainCombustionEngineTPS' },
          { label: 'Engine Oil Level', value: 'powertrainCombustionEngineEngineOilLevel' },
          { label: 'Engine Air Intake (g/s)', value: 'powertrainCombustionEngineMAF' },
          
          // Tire Pressure Signals
          { label: 'Front Left Tire Pressure (kPa)', value: 'chassisAxleRow1WheelLeftTirePressure' },
          { label: 'Front Right Tire Pressure (kPa)', value: 'chassisAxleRow1WheelRightTirePressure' },
          { label: 'Rear Left Tire Pressure (kPa)', value: 'chassisAxleRow2WheelLeftTirePressure' },
          { label: 'Rear Right Tire Pressure (kPa)', value: 'chassisAxleRow2WheelRightTirePressure' },
          
          // Door Signals
          { label: 'Front Driver Door Open (0/1)', value: 'cabinDoorRow1DriverSideIsOpen' },
          { label: 'Front Passenger Door Open (0/1)', value: 'cabinDoorRow1PassengerSideIsOpen' },
          { label: 'Rear Driver Door Open (0/1)', value: 'cabinDoorRow2DriverSideIsOpen' },
          { label: 'Rear Passenger Door Open (0/1)', value: 'cabinDoorRow2PassengerSideIsOpen' },
          
          // Window Signals
          { label: 'Front Driver Window Open (0/1)', value: 'cabinDoorRow1DriverSideWindowIsOpen' },
          { label: 'Front Passenger Window Open (0/1)', value: 'cabinDoorRow1PassengerSideWindowIsOpen' },
          { label: 'Rear Driver Window Open (0/1)', value: 'cabinDoorRow2DriverSideWindowIsOpen' },
          { label: 'Rear Passenger Window Open (0/1)', value: 'cabinDoorRow2PassengerSideWindowIsOpen' },
          
          // Environment Signals
          { label: 'Exterior Air Temperature (°C)', value: 'exteriorAirTemperature' },
          
          // OBD Signals
          { label: 'Diagnostic Trouble Codes', value: 'obdDTCList' },
          { label: 'Engine Runtime (seconds)', value: 'obdRunTime' },
          { label: 'Intake Temperature (°C)', value: 'obdIntakeTemp' },
          { label: 'Barometric Pressure (kPa)', value: 'obdBarometricPressure' },
          
          // Aftermarket Device Signals
          { label: 'WiFi WPA State', value: 'dimoAftermarketWPAState' },
          { label: 'WiFi SSID', value: 'dimoAftermarketSSID' },
          { label: 'GPS Satellites Count', value: 'dimoAftermarketNSAT' },
          { label: 'GPS Horizontal Dilution', value: 'dimoAftermarketHDOP' },
        ],
      },
    }),
    
    // Historical query parameters
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
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Time span for aggregation (duration string)',
      required: false,
      defaultValue: '1h',
      options: {
        options: [
          { label: '300ms (300 milliseconds)', value: '300ms' },
          { label: '1s (1 second)', value: '1s' },
          { label: '30s (30 seconds)', value: '30s' },
          { label: '1m (1 minute)', value: '1m' },
          { label: '5m (5 minutes)', value: '5m' },
          { label: '15m (15 minutes)', value: '15m' },
          { label: '30m (30 minutes)', value: '30m' },
          { label: '1h (1 hour)', value: '1h' },
          { label: '6h (6 hours)', value: '6h' },
          { label: '12h (12 hours)', value: '12h' },
          { label: '24h (24 hours)', value: '24h' },
          { label: '2h45m (2 hours 45 minutes)', value: '2h45m' },
        ],
      },
    }),
    
    aggregationType: Property.StaticDropdown({
      displayName: 'Aggregation Type',
      description: 'How to aggregate data for historical queries (applies to float signals)',
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
    
    stringAggregationType: Property.StaticDropdown({
      displayName: 'String Aggregation Type',
      description: 'How to aggregate string signals for historical queries',
      required: false,
      defaultValue: 'TOP',
      options: {
        options: [
          { label: 'Most Frequent (TOP)', value: 'TOP' },
          { label: 'Random Sample (RAND)', value: 'RAND' },
          { label: 'Unique Values (UNIQUE)', value: 'UNIQUE' },
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
      vehicleJwt, 
      autoExchange,
      privileges,
      vehicleTokenId, 
      queryType, 
      signals,
      fromDate, 
      toDate, 
      interval, 
      aggregationType,
      stringAggregationType,
      sourceFilter,
      customQuery 
    } = context.propsValue;
    
    let finalVehicleJwt = vehicleJwt;
    
    // Auto-exchange for Vehicle JWT if needed
    if (!finalVehicleJwt && autoExchange) {
      if (!privileges || privileges.length === 0) {
        throw new Error('Privileges are required when Auto-Exchange is enabled. Please select at least one privilege.');
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
      throw new Error('Vehicle JWT is required for Telemetry API. Either provide a Vehicle JWT directly, enable Auto-Exchange with privileges, or use the "Token Exchange API" action first.');
    }

    let graphqlQuery = '';
    
    // Define string signals that need string aggregation
    const stringSignals = [
      'powertrainType',
      'powertrainFuelSystemSupportedFuelTypes',
      'powertrainCombustionEngineEngineOilLevel',
      'obdDTCList',
      'dimoAftermarketWPAState',
      'dimoAftermarketSSID',
      'powertrainTractionBatteryChargingIsCharging'
    ];
    
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
        
        // Build signal fields for latest query
        const latestSignalFields = signals.map(signal => {
          if (signal === 'lastSeen') {
            return signal; // lastSeen is a scalar field
          }
          return `${signal} {
            value
            timestamp
          }`;
        }).join('\n    ');
        
        const filterClause = sourceFilter ? `, filter: { source: "${sourceFilter}" }` : '';
        
        graphqlQuery = `
          query GetLatestSignals {
            signalsLatest(tokenId: ${vehicleTokenId}${filterClause}) {
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
        
        // Build signal fields for historical query with proper aggregation
        const historicalSignalFields = signals.map(signal => {
          if (signal === 'lastSeen') {
            return; // lastSeen is not available in historical queries
          }
          
          const isStringSignal = stringSignals.includes(signal);
          const aggType = isStringSignal ? (stringAggregationType || 'TOP') : (aggregationType || 'AVG');
          
          return `${signal}(agg: ${aggType})`;
        }).filter(Boolean).join('\n    ');
        
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
          'Authorization': `Bearer ${finalVehicleJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired Vehicle JWT. Please use the Token Exchange API to get a fresh Vehicle JWT.');
      }
      
      if (response.status === 403) {
        throw new Error('Forbidden: Vehicle JWT does not have sufficient privileges for the requested data. Check your permissions and ensure you have the required privileges for the signals you are requesting.');
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
          stringAggregationType: queryType === 'historical' ? stringAggregationType : null,
          timeRange: queryType === 'historical' ? { 
            from: fromDate, 
            to: toDate, 
            interval: interval || '1h' 
          } : null,
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
            throw new Error(`Permission denied: ${errorBody?.message || 'Vehicle JWT does not have sufficient privileges for the requested telemetry data. Ensure you have the required permissions for the signals you are requesting.'}`);
          case 400:
            throw new Error(`Bad request: ${errorBody?.message || 'Invalid query parameters, GraphQL syntax, or signal names. Check your query and try again.'}`);
          default:
            throw new Error(`Telemetry API failed: ${errorBody?.message || error.message}`);
        }
      }
      
      throw new Error(`Telemetry API request failed: ${error.message}`);
    }
  },
}); 