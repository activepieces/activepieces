import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { IDENTITY_BASE_URL,commonQueries } from './constant';
import { handleFailures } from '../../helpers';

export const identityApiAction = createAction({
  requireAuth : false,
  name: 'identity-api-query',
  displayName: 'Identity API (GraphQL)',
  description: 'Query DIMO Identity API using GraphQL - open catalog of vehicles, devices, and rewards (no authentication required)',
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
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: false,
    }),
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: false,
    }),
    devLicenseTokenId: Property.Number({
      displayName: 'Developer License Token ID',
      description: 'Token ID of the developer license',
      required: false,
    }),
    first: Property.Number({
      displayName: 'First (Limit)',
      description: 'Number of records to return (default: 10)',
      required: false,
      defaultValue: 10,
    }),
    deviceDefinitionId: Property.ShortText({
      displayName: 'Device Definition ID',
      description: 'ID of the device definition',
      required: false,
    }),
    devLicense0x: Property.ShortText({
      displayName: 'Dev License 0x',
      description: '0x address for developer license',
      required: false,
    }),
  },
  async run(context) {
    const { queryType, customQuery, vehicleTokenId, ownerAddress, devLicenseTokenId, first, deviceDefinitionId, devLicense0x } = context.propsValue;

    let graphqlQuery = '';

    if (queryType === 'custom') {
      if (!customQuery) {
        throw new Error('Custom GraphQL query is required when Query Type is "Custom GraphQL Query"');
      }
      graphqlQuery = customQuery;
    } else {

      const queryEntry = commonQueries[queryType as keyof typeof commonQueries]; ;
      if (!queryEntry) {
        throw new Error(`Query '${queryType}' is not defined in commonQueries.`);
      }

      graphqlQuery = queryEntry.query;

      // Parametreleri otomatik replace et
      if (graphqlQuery.includes('<vehicleTokenId>') && vehicleTokenId !== undefined) {
        graphqlQuery = graphqlQuery.replace(/<vehicleTokenId>/g, String(vehicleTokenId));
      }
      if (graphqlQuery.includes('<ownerAddress>') && ownerAddress) {
        graphqlQuery = graphqlQuery.replace(/<ownerAddress>/g, ownerAddress);
      }
      if (graphqlQuery.includes('<devLicenseTokenId>') && devLicenseTokenId !== undefined) {
        graphqlQuery = graphqlQuery.replace(/<devLicenseTokenId>/g, String(devLicenseTokenId));
      }
      if (graphqlQuery.includes('<deviceDefinitionId>') && deviceDefinitionId) {
        graphqlQuery = graphqlQuery.replace(/<deviceDefinitionId>/g, deviceDefinitionId);
      }
      if (graphqlQuery.includes('<devLicense0x>') && devLicense0x) {
        graphqlQuery = graphqlQuery.replace(/<devLicense0x>/g, devLicense0x);
      }
      if (graphqlQuery.includes('first: 100') && first) {
        graphqlQuery = graphqlQuery.replace(/first: 100/g, `first: ${first}`);
      }
      if (graphqlQuery.includes('first: 10') && first) {
        graphqlQuery = graphqlQuery.replace(/first: 10/g, `first: ${first}`);
      }
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${IDENTITY_BASE_URL}`,
        body: {
          query: graphqlQuery,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      handleFailures(response);

      if (response.body.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
      }

      return response.body.data;

    } catch (error) {
      throw new Error(`Identity API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
