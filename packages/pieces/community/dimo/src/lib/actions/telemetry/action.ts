import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { commonQueries, TELEMETR_API_BASE_URL } from './constant';
import { dimoAuth } from '../../../index';
import { getHeaders } from '../../helpers';

// Ortak GraphQL request helper
async function sendTelemetryGraphQLRequest(query: string, vehicleJwt: string) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: TELEMETR_API_BASE_URL,
    body: { query },
    headers: getHeaders({ vehicleJwt }, 'vehicle'),
  });
  if (response.body.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
  }
  return response.body.data;
}

export const telemetryApiCustomQueryAction = createAction({
  auth: dimoAuth,
  name: 'telemetry-api-custom-query',
  displayName: 'Telemetry API (Custom GraphQL)',
  description: 'Query DIMO Telemetry API using a custom GraphQL query.',
  props: {
    customQuery: Property.LongText({
      displayName: 'Custom GraphQL Query',
      description: 'Enter your GraphQL query here',
      required: true,
    }),
  },
  async run(context) {
    const { customQuery } = context.propsValue;
    const { vehicleJwt } = context.auth;
    if (!customQuery) {
      throw new Error('Custom GraphQL query is required.');
    }
    if (!vehicleJwt) {
      throw new Error('vehicleJwt is required for Telemetry API.');
    }
    return await sendTelemetryGraphQLRequest(customQuery, vehicleJwt);
  },
});

export const availableSignalsAction = createAction({
  auth: dimoAuth,
  name: 'telemetry-available-signals',
  displayName: 'Telemetry: Available Signals',
  description: 'Get a list of available signals for a specific vehicle',
  props: {
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
  },
  async run(context) {
    const { tokenId } = context.propsValue;
    const { vehicleJwt } = context.auth;
    if (!vehicleJwt) throw new Error('vehicleJwt is required');
    const query = commonQueries.avaiableSignals.query.replace(/\$tokenId/g, String(tokenId));
    return await sendTelemetryGraphQLRequest(query, vehicleJwt);
  },
});

export const signalsAction = createAction({
  auth: dimoAuth,
  name: 'telemetry-signals',
  displayName: 'Telemetry: Signals',
  description: 'Get a selection of available signals for a specific vehicle',
  props: {
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date for the query (YYYY-MM-DD)',
      required: true,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date for the query (YYYY-MM-DD)',
      required: true,
    }),
  },
  async run(context) {
    const { tokenId, startDate, endDate } = context.propsValue;
    const { vehicleJwt } = context.auth;
    if (!vehicleJwt) throw new Error('vehicleJwt is required');
    const query = commonQueries.signals.query
      .replace(/\$tokenId/g, String(tokenId))
      .replace(/\$startDate/g, startDate)
      .replace(/\$endDate/g, endDate);
    return await sendTelemetryGraphQLRequest(query, vehicleJwt);
  },
});

export const getDailyAvgSpeedOfVehicleAction = createAction({
  auth: dimoAuth,
  name: 'telemetry-daily-avg-speed',
  displayName: 'Telemetry: Daily Avg Speed',
  description: 'Get the average speed of a vehicle over a specific time period',
  props: {
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date for the query (YYYY-MM-DD)',
      required: true,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date for the query (YYYY-MM-DD)',
      required: true,
    }),
  },
  async run(context) {
    const { tokenId, startDate, endDate } = context.propsValue;
    const { vehicleJwt } = context.auth;
    if (!vehicleJwt) throw new Error('vehicleJwt is required');
    const query = commonQueries.getDailyAvgSpeedOfVehicle.query
      .replace(/\$tokenId/g, String(tokenId))
      .replace(/\$startDate/g, startDate)
      .replace(/\$endDate/g, endDate);
    return await sendTelemetryGraphQLRequest(query, vehicleJwt);
  },
});

export const getMaxSpeedOfVehicleAction = createAction({
  auth: dimoAuth,
  name: 'telemetry-max-speed',
  displayName: 'Telemetry: Max Speed',
  description: 'Get the maximum speed of a vehicle over a specific time period',
  props: {
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date for the query (YYYY-MM-DD)',
      required: true,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date for the query (YYYY-MM-DD)',
      required: true,
    }),
    interval: Property.ShortText({
      displayName: 'Interval',
      description: 'Interval (e.g. 24h)',
      required: true,
    }),
  },
  async run(context) {
    const { tokenId, startDate, endDate, interval } = context.propsValue;
    const { vehicleJwt } = context.auth;
    if (!vehicleJwt) throw new Error('vehicleJwt is required');
    const query = commonQueries.getMaxSpeedOfVehicle.query
      .replace(/\$tokenId/g, String(tokenId))
      .replace(/\$startDate/g, startDate)
      .replace(/\$endDate/g, endDate)
      .replace(/\$interval/g, interval);
    return await sendTelemetryGraphQLRequest(query, vehicleJwt);
  },
});

export const getVinVcLatestAction = createAction({
  auth: dimoAuth,
  name: 'telemetry-vin-vc-latest',
  displayName: 'Telemetry: VIN VC Latest',
  description: 'Get the latest VIN and Vehicle Configuration for a specific vehicle',
  props: {
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
  },
  async run(context) {
    const { tokenId } = context.propsValue;
    const { vehicleJwt } = context.auth;
    if (!vehicleJwt) throw new Error('vehicleJwt is required');
    const query = commonQueries.getVinVcLatest.query.replace(/\$tokenId/g, String(tokenId));
    return await sendTelemetryGraphQLRequest(query, vehicleJwt);
  },
});


export const telemetryApiActions = [
  telemetryApiCustomQueryAction,
  availableSignalsAction,
  signalsAction,
  getDailyAvgSpeedOfVehicleAction,
  getMaxSpeedOfVehicleAction,
  getVinVcLatestAction,
];
