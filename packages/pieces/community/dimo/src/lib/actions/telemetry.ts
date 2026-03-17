import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import { DIMO_API_URLS } from '../common/constants';

export const dimoGetAvailableSignals = createAction({
  auth: dimoDeveloperAuth,
  name: 'telemetry_get_available_signals',
  displayName: 'Get Available Signals for Vehicle',
  description: 'Look up all available telemetry data fields for a specific vehicle. Requires Vehicle JWT.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Telemetry API calls.');
    }

    const { token_id } = context.propsValue;

    const query = `{
      availableSignals(tokenId: ${token_id})
    }`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.TELEMETRY,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
        'Content-Type': 'application/json',
      },
      body: { query },
    });

    return response.body;
  },
});

export const dimoGetLatestVehicleSignals = createAction({
  auth: dimoDeveloperAuth,
  name: 'telemetry_get_latest_signals',
  displayName: 'Get Latest Vehicle Signals',
  description: 'Get the latest telemetry signal values for a vehicle. Requires Vehicle JWT.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
    signals: Property.Array({
      displayName: 'Signal Names',
      description: `List of signal names to retrieve. Common signals:
- speed
- powertrainTransmissionTravelledDistance (odometer)
- isIgnitionOn
- powertrainFuelSystemRelativeLevel
- powertrainFuelSystemAbsoluteLevel
- powertrainTractionBatteryCurrentPower
- powertrainTractionBatteryChargingIsCharging
- powertrainTractionBatteryStateOfChargeCurrent
- chassisAxleRow1WheelLeftTirePressure`,
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Telemetry API calls.');
    }

    const { token_id, signals } = context.propsValue;
    const signalList = signals as string[];

    // Build dynamic GraphQL query for requested signals
    const signalFields = signalList
      .map((s) => `${s} { timestamp value }`)
      .join('\n        ');

    const query = `{
      signalsLatest(tokenId: ${token_id}) {
        ${signalFields}
      }
    }`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.TELEMETRY,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
        'Content-Type': 'application/json',
      },
      body: { query },
    });

    return response.body;
  },
});

export const dimoGetHistoricalSignals = createAction({
  auth: dimoDeveloperAuth,
  name: 'telemetry_get_historical_signals',
  displayName: 'Get Historical Vehicle Signals',
  description: 'Get historical telemetry data for a vehicle over a time range. Requires Vehicle JWT.',
  props: {
    token_id: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The NFT token ID of the vehicle.',
      required: true,
    }),
    signal: Property.ShortText({
      displayName: 'Signal Name',
      description: 'The signal to query (e.g. "speed", "powertrainTransmissionTravelledDistance").',
      required: true,
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'ISO 8601 start timestamp (e.g. 2024-01-01T00:00:00Z).',
      required: true,
    }),
    end_time: Property.ShortText({
      displayName: 'End Time',
      description: 'ISO 8601 end timestamp (e.g. 2024-01-31T23:59:59Z).',
      required: true,
    }),
    interval: Property.ShortText({
      displayName: 'Interval (optional)',
      description: 'Aggregation interval (e.g. "1h", "30m", "1d").',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Telemetry API calls.');
    }

    const { token_id, signal, start_time, end_time, interval } = context.propsValue;

    let intervalPart = '';
    if (interval) {
      intervalPart = `, interval: "${interval}"`;
    }

    const query = `{
      signals(tokenId: ${token_id}, from: "${start_time}", to: "${end_time}"${intervalPart}) {
        ${signal} {
          timestamp
          value
        }
      }
    }`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.TELEMETRY,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
        'Content-Type': 'application/json',
      },
      body: { query },
    });

    return response.body;
  },
});

export const dimoTelemetryCustomQuery = createAction({
  auth: dimoDeveloperAuth,
  name: 'telemetry_custom_query',
  displayName: 'Telemetry API - Custom GraphQL Query',
  description: 'Execute a custom GraphQL query against the DIMO Telemetry API. Requires Vehicle JWT. Explore at https://telemetry-api.dimo.zone/',
  props: {
    query: Property.LongText({
      displayName: 'GraphQL Query',
      description: 'A valid GraphQL query to execute against the Telemetry API.',
      required: true,
    }),
    variables: Property.Json({
      displayName: 'Variables (optional)',
      description: 'GraphQL variables as a JSON object.',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const vehicleJwt = auth.vehicle_jwt;

    if (!vehicleJwt) {
      throw new Error('Vehicle JWT is required for Telemetry API calls.');
    }

    const { query, variables } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: DIMO_API_URLS.TELEMETRY,
      headers: {
        Authorization: `Bearer ${vehicleJwt}`,
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
