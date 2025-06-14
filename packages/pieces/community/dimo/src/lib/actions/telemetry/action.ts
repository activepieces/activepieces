import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { commonQueries, TELEMETR_API_BASE_URL } from './constant';

export const telemetryApiAction = createAction({
  requireAuth: false,
  name: 'telemetry_api',
  displayName: 'Telemetry API (GraphQL)',
  description: 'Query DIMO Telemetry API using GraphQL for vehicle signals and telemetry data.',
  props: {
    queryType: Property.StaticDropdown({
      displayName: 'Query Type',
      description: 'Choose a pre-built query or write custom GraphQL',
      required: true,
      defaultValue: 'custom',
      options: {
        options: [
          { label: 'Custom GraphQL Query', value: 'custom' },
          ...Object.entries(commonQueries).map(([key, val]) => ({ label: val.label, value: key }))
        ],
      },
    }),
    customQuery: Property.LongText({
      displayName: 'Custom GraphQL Query',
      description: 'Enter your GraphQL query here',
      required: false,
    }),
    tokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: false,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date for the query (YYYY-MM-DD)',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date for the query (YYYY-MM-DD)',
      required: false,
    }),
    numDays: Property.Number({
      displayName: 'Number of Days',
      description: 'Number of days for interval queries',
      required: false,
    }),
  },
  async run(context) {
    const { queryType, customQuery, tokenId, startDate, endDate, numDays } = context.propsValue;
    let graphqlQuery = '';
    if (queryType === 'custom') {
      if (!customQuery) {
        throw new Error('Custom GraphQL query is required when Query Type is "Custom GraphQL Query"');
      }
      graphqlQuery = customQuery;
    } else {
      const queryEntry = commonQueries[queryType as keyof typeof commonQueries];
      if (!queryEntry) {
        throw new Error(`Query '${queryType}' is not defined in commonQueries.`);
      }
      graphqlQuery = queryEntry.query;
      if (graphqlQuery.includes('${tokenId}') && tokenId !== undefined) {
        graphqlQuery = graphqlQuery.replace(/\$\{tokenId\}/g, String(tokenId));
      }
      if (graphqlQuery.includes('${startDate}') && startDate) {
        graphqlQuery = graphqlQuery.replace(/\$\{startDate\}/g, startDate);
      }
      if (graphqlQuery.includes('${endDate}') && endDate) {
        graphqlQuery = graphqlQuery.replace(/\$\{endDate\}/g, endDate);
      }
      if (graphqlQuery.includes('${numDays}') && numDays !== undefined) {
        graphqlQuery = graphqlQuery.replace(/\$\{numDays\}/g, String(numDays));
      }
    }
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: TELEMETR_API_BASE_URL,
        body: { query: graphqlQuery },
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.body.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
      }
      return response.body.data;
    } catch (error) {
      throw new Error(`Telemetry API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
