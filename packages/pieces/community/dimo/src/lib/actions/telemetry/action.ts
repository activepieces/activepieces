import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { commonQueries, TELEMETRY_API_BASE_URL } from './constant';
import { dimoAuth } from '../../../index';
import { getHeaders, handleFailures } from '../../helpers';
import { getVehicleToken } from '../token-exchange/helper';

// Ortak GraphQL request helper
async function sendTelemetryGraphQLRequest(query: string, tokenId: number, developerJwt: string) {
  const vehicleJwt = await getVehicleToken(developerJwt, tokenId);
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: TELEMETRY_API_BASE_URL,
    body: { query },
    headers: getHeaders(vehicleJwt),
  });

  handleFailures(response);

  return response.body;
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
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
  },
  async run(context) {
    const { customQuery, tokenId } = context.propsValue;
    const { developerJwt } = context.auth;
    if (!customQuery) {
      throw new Error('Custom GraphQL query is required.');
    }
    if (!tokenId) {
      throw new Error('tokenId is required for Telemetry API.');
    }
    if (!developerJwt) {
      throw new Error('developerJwt is required for Telemetry API.');
    }
    return await sendTelemetryGraphQLRequest(customQuery, tokenId, developerJwt);
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
    const { developerJwt } = context.auth;
    if (!tokenId) throw new Error('tokenId is required');
    if (!developerJwt) throw new Error('developerJwt is required');
    const query = commonQueries.avaiableSignals.replace("<tokenId>", String(tokenId));
    return await sendTelemetryGraphQLRequest(query, tokenId, developerJwt);
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
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for the query',
      required: true,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for the query',
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
    const { developerJwt } = context.auth;
    if (!tokenId) throw new Error('tokenId is required');
    if (!developerJwt) throw new Error('developerJwt is required');
    const query = commonQueries.signals
    .replace("<tokenId>", String(tokenId))
    .replace("<startDate>", startDate)
    .replace("<endDate>", endDate)
    .replace("<interval>", interval)
    return await sendTelemetryGraphQLRequest(query, tokenId, developerJwt);
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
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for the query (YYYY-MM-DD)',
      required: true,
    }),
    endDate: Property.DateTime({
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
    const { developerJwt } = context.auth;
    if (!tokenId) throw new Error('tokenId is required');
    if (!developerJwt) throw new Error('developerJwt is required');
    const query = commonQueries.getDailyAvgSpeedOfVehicle
    .replace("<tokenId>", String(tokenId))
    .replace("<startDate>", startDate)
    .replace("<endDate>", endDate)
    .replace("<interval>", interval)
    return await sendTelemetryGraphQLRequest(query, tokenId, developerJwt);
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
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for the query (YYYY-MM-DD)',
      required: true,
    }),
    endDate: Property.DateTime({
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
    const { developerJwt } = context.auth;
    if (!tokenId) throw new Error('tokenId is required');
    if (!developerJwt) throw new Error('developerJwt is required');
    const query = commonQueries.getMaxSpeedOfVehicle
      .replace("<tokenId>", String(tokenId))
      .replace("<startDate>", startDate)
      .replace("<endDate>", endDate)
      .replace("<interval>", interval)
    return await sendTelemetryGraphQLRequest(query, tokenId, developerJwt);
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
    const { developerJwt } = context.auth;
    if (!tokenId) throw new Error('tokenId is required');
    if (!developerJwt) throw new Error('developerJwt is required');
    const query = commonQueries.getVinVcLatest.replace("<tokenId>", String(tokenId));
    return await sendTelemetryGraphQLRequest(query, tokenId, developerJwt);
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
