import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const identityApiAction = createAction({
  auth: dimoAuth,
  name: 'identity_api',
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
          { label: 'Get Vehicle by Token ID', value: 'vehicle_by_token' },
          { label: 'Get Vehicles by Owner', value: 'vehicles_by_owner' },
          { label: 'Get Total Vehicles Count', value: 'total_vehicles' },
          { label: 'Get Manufacturer Info', value: 'manufacturer_info' },
          { label: 'Get Developer License Info', value: 'dev_license_info' },
          { label: 'Get Rewards by Owner', value: 'rewards_by_owner' },
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
    manufacturerName: Property.ShortText({
      displayName: 'Manufacturer Name',
      description: 'Name of the manufacturer (e.g., Tesla)',
      required: false,
    }),
    manufacturerTokenId: Property.Number({
      displayName: 'Manufacturer Token ID',
      description: 'Token ID of the manufacturer',
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
  },
  async run(context) {
    const { queryType, customQuery, vehicleTokenId, ownerAddress, manufacturerName, manufacturerTokenId, devLicenseTokenId, first } = context.propsValue;
    
    let graphqlQuery = '';
    
    switch (queryType) {
      case 'custom':
        if (!customQuery) {
          throw new Error('Custom GraphQL query is required when Query Type is "Custom GraphQL Query"');
        }
        graphqlQuery = customQuery;
        break;
        
      case 'vehicle_by_token':
        if (!vehicleTokenId) {
          throw new Error('Vehicle Token ID is required for this query type');
        }
        graphqlQuery = `
          query GetVehicleByTokenId {
            vehicle(tokenId: ${vehicleTokenId}) {
              id
              tokenId
              name
              image
              owner
              mintedAt
              manufacturer {
                name
                tokenId
              }
              definition {
                make
                model
                year
                deviceType
              }
              aftermarketDevice {
                name
                serial
                manufacturer {
                  name
                }
              }
              syntheticDevice {
                tokenId
                integrationId
              }
              dcn {
                name
                node
              }
            }
          }`;
        break;
        
      case 'vehicles_by_owner':
        if (!ownerAddress) {
          throw new Error('Owner Address is required for this query type');
        }
        graphqlQuery = `
          query GetVehiclesByOwner {
            vehicles(filterBy: {owner: "${ownerAddress}"}, first: ${first || 10}) {
              totalCount
              nodes {
                id
                tokenId
                name
                image
                owner
                mintedAt
                definition {
                  make
                  model
                  year
                }
              }
            }
          }`;
        break;
        
      case 'total_vehicles':
        graphqlQuery = `
          query GetTotalVehicles {
            vehicles(first: 1) {
              totalCount
            }
          }`;
        break;
        
      case 'manufacturer_info':
        if (!manufacturerName && !manufacturerTokenId) {
          throw new Error('Either Manufacturer Name or Manufacturer Token ID is required for this query type');
        }
        const manufacturerFilter = manufacturerName ? `name: "${manufacturerName}"` : `tokenId: ${manufacturerTokenId}`;
        graphqlQuery = `
          query GetManufacturerInfo {
            manufacturer(by: { ${manufacturerFilter} }) {
              id
              tokenId
              name
              owner
              mintedAt
              aftermarketDevices(first: ${first || 10}) {
                totalCount
                nodes {
                  name
                  serial
                  tokenId
                }
              }
            }
          }`;
        break;
        
      case 'dev_license_info':
        if (!devLicenseTokenId) {
          throw new Error('Developer License Token ID is required for this query type');
        }
        graphqlQuery = `
          query GetDevLicenseInfo {
            developerLicense(by: { tokenId: ${devLicenseTokenId} }) {
              tokenId
              owner
              clientId
              alias
              mintedAt
              redirectURIs(first: 10) {
                nodes {
                  uri
                  enabledAt
                }
              }
            }
          }`;
        break;
        
      case 'rewards_by_owner':
        if (!ownerAddress) {
          throw new Error('Owner Address is required for this query type');
        }
        graphqlQuery = `
          query GetRewardsByOwner {
            rewards(user: "${ownerAddress}") {
              totalTokens
            }
            vehicles(filterBy: {owner: "${ownerAddress}"}, first: ${first || 10}) {
              nodes {
                tokenId
                earnings {
                  totalTokens
                  history(first: 5) {
                    edges {
                      node {
                        week
                        aftermarketDeviceTokens
                        syntheticDeviceTokens
                        streakTokens
                        sentAt
                        beneficiary
                        connectionStreak
                      }
                    }
                  }
                }
              }
            }
          }`;
        break;
        
      default:
        throw new Error('Invalid query type selected');
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://identity-api.dimo.zone/query',
        body: {
          query: graphqlQuery,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.body.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(response.body.errors)}`);
      }

      return response.body.data;
    } catch (error: any) {
      throw new Error(`Identity API request failed: ${error.message}`);
    }
  },
}); 