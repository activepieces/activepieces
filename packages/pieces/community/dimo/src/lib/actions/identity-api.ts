import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const identityApiAction = createAction({
  auth: dimoAuth,
  name: 'identity_api',
  displayName: 'Identity API (GraphQL)',
  description: 'Query DIMO Identity API - public catalog of vehicles, devices, manufacturers, and rewards (no authentication required)',
  props: {
    queryType: Property.StaticDropdown({
      displayName: 'Query Type',
      description: 'Choose a pre-built query or write custom GraphQL',
      required: true,
      defaultValue: 'vehicles_by_owner',
      options: {
        options: [
          { label: 'Custom GraphQL Query', value: 'custom' },
          
          // Vehicle queries
          { label: 'Get Vehicle by Token ID', value: 'vehicle_by_token' },
          { label: 'Get Vehicles by Owner', value: 'vehicles_by_owner' },
          { label: 'Get Vehicles by Privileged User', value: 'vehicles_by_privileged' },
          
          // AftermarketDevice queries
          { label: 'Get Aftermarket Device by Token ID', value: 'aftermarket_device' },
          { label: 'Get Aftermarket Devices by Owner', value: 'aftermarket_devices_by_owner' },
          { label: 'Get Aftermarket Devices by Manufacturer', value: 'aftermarket_devices_by_manufacturer' },
          
          // Manufacturer queries
          { label: 'Get Manufacturer by Name/Token ID', value: 'manufacturer_info' },
          
          // DCN queries
          { label: 'Get DCN by Name', value: 'dcn_by_name' },
          { label: 'Get DCNs by Owner', value: 'dcns_by_owner' },
          
          // Node queries
          { label: 'Get Node by ID', value: 'node_by_id' },
          
          // Rewards/Earnings
          { label: 'Get User Rewards', value: 'user_rewards' },
          { label: 'Get Vehicle Earnings', value: 'vehicle_earnings' },
        ],
      },
    }),
    
    // Custom query
    customQuery: Property.LongText({
      displayName: 'Custom GraphQL Query',
      description: 'Enter your custom GraphQL query',
      required: false,
    }),
    
    // Common parameters
    tokenId: Property.Number({
      displayName: 'Token ID',
      description: 'Token ID (for vehicles, aftermarket devices, manufacturers, etc.)',
      required: false,
    }),
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: false,
    }),
    privilegedAddress: Property.ShortText({
      displayName: 'Privileged Address',
      description: '0x Ethereum address of the privileged user',
      required: false,
    }),
    manufacturerName: Property.ShortText({
      displayName: 'Manufacturer Name',
      description: 'Name of the manufacturer (e.g., "Tesla")',
      required: false,
    }),
    manufacturerId: Property.Number({
      displayName: 'Manufacturer ID',
      description: 'ID of the manufacturer',
      required: false,
    }),
    dcnName: Property.ShortText({
      displayName: 'DCN Name',
      description: 'DIMO Canonical Name (e.g., "elonmusk.dimo")',
      required: false,
    }),
    nodeId: Property.ShortText({
      displayName: 'Node ID',
      description: 'Global node identifier (e.g., "AD_kc1P8Q==")',
      required: false,
    }),
    userAddress: Property.ShortText({
      displayName: 'User Address',
      description: '0x Ethereum address for rewards lookup',
      required: false,
    }),
    
    // Pagination
    first: Property.Number({
      displayName: 'First (Limit)',
      description: 'Number of records to return from the beginning',
      required: false,
      defaultValue: 10,
    }),
    last: Property.Number({
      displayName: 'Last',
      description: 'Number of records to return from the end',
      required: false,
    }),
    after: Property.ShortText({
      displayName: 'After (Cursor)',
      description: 'Cursor for pagination - returns records after this cursor',
      required: false,
    }),
    before: Property.ShortText({
      displayName: 'Before (Cursor)',
      description: 'Cursor for pagination - returns records before this cursor',
      required: false,
    }),
  },
  
  async run(context) {
    const { 
      queryType, 
      customQuery, 
      tokenId, 
      ownerAddress, 
      privilegedAddress,
      manufacturerName, 
      manufacturerId,
      dcnName,
      nodeId,
      userAddress,
      first, 
      last, 
      after, 
      before 
    } = context.propsValue;
    
    let graphqlQuery = '';
    
    // Build pagination arguments
    const buildPaginationArgs = () => {
      const args = [];
      if (first) args.push(`first: ${first}`);
      if (last) args.push(`last: ${last}`);
      if (after) args.push(`after: "${after}"`);
      if (before) args.push(`before: "${before}"`);
      return args.join(', ');
    };
    
    switch (queryType) {
      case 'custom':
        if (!customQuery) {
          throw new Error('Custom GraphQL query is required when Query Type is "Custom GraphQL Query"');
        }
        graphqlQuery = customQuery;
        break;
        
      case 'vehicle_by_token':
        if (!tokenId) {
          throw new Error('Token ID is required for this query type');
        }
        graphqlQuery = `
          query GetVehicleDetails {
            vehicle(tokenId: ${tokenId}) {
              owner
              tokenId
              definition {
                id
                make
                model
                year
              }
              aftermarketDevice {
                tokenId
                address
                owner
                serial
                imei
                devEUI
                mintedAt
                claimedAt
                beneficiary
              }
              dcn {
                tokenId
                owner
                mintedAt
                expiresAt
              }
              earnings {
                totalTokens
                history(first: 5) {
                  edges {
                    node {
                      week
                      beneficiary
                      connectionStreak
                      streakTokens
                      aftermarketDeviceTokens
                      syntheticDeviceTokens
                      sentAt
                    }
                  }
                }
              }
              sacds(first: 10) {
                nodes {
                  permissions
                  grantee
                  source
                  createdAt
                  expiresAt
                }
              }
            }
          }`;
        break;
        
      case 'vehicles_by_owner':
        if (!ownerAddress) {
          throw new Error('Owner Address is required for this query type');
        }
        const ownerPaginationArgs = buildPaginationArgs();
        graphqlQuery = `
          query GetVehiclesByOwner {
            vehicles(${ownerPaginationArgs ? ownerPaginationArgs + ', ' : ''}filterBy: {owner: "${ownerAddress}"}) {
              totalCount
              pageInfo {
                startCursor
                endCursor
                hasPreviousPage
                hasNextPage
              }
              nodes {
                id
                tokenId
                name
                image
                owner
                mintedAt
                definition {
                  id
                  model
                  year
                }
                aftermarketDevice {
                  name
                  serial
                }
                syntheticDevice {
                  integrationId
                }
              }
            }
          }`;
        break;
        
      case 'vehicles_by_privileged':
        if (!privilegedAddress) {
          throw new Error('Privileged Address is required for this query type');
        }
        const privilegedPaginationArgs = buildPaginationArgs();
        graphqlQuery = `
          query GetVehiclesByPrivileged {
            vehicles(${privilegedPaginationArgs ? privilegedPaginationArgs + ', ' : ''}filterBy: {privileged: "${privilegedAddress}"}) {
              totalCount
              pageInfo {
                startCursor
                endCursor
                hasPreviousPage
                hasNextPage
              }
              nodes {
                id
                tokenId
                name
                image
                owner
                mintedAt
              }
            }
          }`;
        break;
        
      case 'aftermarket_device':
        if (!tokenId) {
          throw new Error('Token ID is required for this query type');
        }
        graphqlQuery = `
          query GetAftermarketDevice {
            aftermarketDevice(by: {tokenId: ${tokenId}}) {
              id
              tokenId
              address
              owner
              serial
              imei
              devEUI
              mintedAt
              claimedAt
              beneficiary
              name
              image
              vehicle {
                id
                tokenId
                name
                owner
              }
              earnings {
                totalTokens
                history(first: 5) {
                  edges {
                    node {
                      week
                      aftermarketDeviceTokens
                      sentAt
                    }
                  }
                }
              }
            }
          }`;
        break;
        
      case 'aftermarket_devices_by_owner':
        if (!ownerAddress) {
          throw new Error('Owner Address is required for this query type');
        }
        const adOwnerPaginationArgs = buildPaginationArgs();
        graphqlQuery = `
          query GetAftermarketDevicesByOwner {
            aftermarketDevices(${adOwnerPaginationArgs ? adOwnerPaginationArgs + ', ' : ''}filterBy: {owner: "${ownerAddress}"}) {
              totalCount
              pageInfo {
                startCursor
                endCursor
                hasPreviousPage
                hasNextPage
              }
              nodes {
                id
                tokenId
                address
                owner
                serial
                name
                image
                mintedAt
                claimedAt
                manufacturer {
                  name
                }
                vehicle {
                  tokenId
                  name
                }
              }
            }
          }`;
        break;
        
      case 'aftermarket_devices_by_manufacturer':
        if (!manufacturerId) {
          throw new Error('Manufacturer ID is required for this query type');
        }
        const adMfgPaginationArgs = buildPaginationArgs();
        graphqlQuery = `
          query GetAftermarketDevicesByManufacturer {
            aftermarketDevices(${adMfgPaginationArgs ? adMfgPaginationArgs + ', ' : ''}filterBy: {manufacturerId: ${manufacturerId}}) {
              totalCount
              pageInfo {
                startCursor
                endCursor
                hasPreviousPage
                hasNextPage
              }
              nodes {
                id
                tokenId
                address
                owner
                serial
                name
                image
                mintedAt
                claimedAt
                vehicle {
                  tokenId
                  name
                }
              }
            }
          }`;
        break;
        
      case 'manufacturer_info':
        if (!manufacturerName && !tokenId) {
          throw new Error('Either Manufacturer Name or Token ID is required for this query type');
        }
        const manufacturerFilter = manufacturerName ? `name: "${manufacturerName}"` : `tokenId: ${tokenId}`;
        const mfgDevicePaginationArgs = buildPaginationArgs() || 'first: 10';
        graphqlQuery = `
          query GetManufacturerInfo {
            manufacturer(by: {${manufacturerFilter}}) {
              id
              tokenId
              name
              owner
              mintedAt
              aftermarketDevices(${mfgDevicePaginationArgs}) {
                totalCount
                pageInfo {
                  startCursor
                  endCursor
                  hasPreviousPage
                  hasNextPage
                }
                nodes {
                  id
                  tokenId
                  name
                  serial
                  owner
                  mintedAt
                }
              }
            }
          }`;
        break;
        
      case 'dcn_by_name':
        if (!dcnName) {
          throw new Error('DCN Name is required for this query type');
        }
        graphqlQuery = `
          query GetDCNByName {
            dcn(by: {name: "${dcnName}"}) {
              node
              tokenId
              name
              owner
              mintedAt
              expiresAt
              vehicle {
                id
                tokenId
                name
                owner
              }
            }
          }`;
        break;
        
      case 'dcns_by_owner':
        if (!ownerAddress) {
          throw new Error('Owner Address is required for this query type');
        }
        const dcnPaginationArgs = buildPaginationArgs();
        graphqlQuery = `
          query GetDCNsByOwner {
            dcns(${dcnPaginationArgs ? dcnPaginationArgs + ', ' : ''}filterBy: {owner: "${ownerAddress}"}) {
              totalCount
              pageInfo {
                startCursor
                endCursor
                hasPreviousPage
                hasNextPage
              }
              nodes {
                tokenId
                name
                owner
                mintedAt
                expiresAt
                vehicle {
                  tokenId
                  name
                }
              }
            }
          }`;
        break;
        
      case 'node_by_id':
        if (!nodeId) {
          throw new Error('Node ID is required for this query type');
        }
        graphqlQuery = `
          query GetNodeById {
            node(id: "${nodeId}") {
              id
              ... on AftermarketDevice {
                serial
                imei
                devEUI
                claimedAt
                beneficiary
                name
                image
                vehicle {
                  tokenId
                  name
                }
              }
              ... on Manufacturer {
                id
                tokenId
                name
                owner
                mintedAt
              }
              ... on Vehicle {
                id
                tokenId
                name
                image
                owner
                mintedAt
              }
            }
          }`;
        break;
        
      case 'user_rewards':
        if (!userAddress) {
          throw new Error('User Address is required for this query type');
        }
        const rewardsPaginationArgs = buildPaginationArgs() || 'first: 10';
        graphqlQuery = `
          query GetUserRewards {
            rewards(user: "${userAddress}") {
              totalTokens
            }
          }`;
        break;
        
      case 'vehicle_earnings':
        if (!tokenId) {
          throw new Error('Token ID is required for this query type');
        }
        const earningsPaginationArgs = buildPaginationArgs() || 'first: 10';
        graphqlQuery = `
          query GetVehicleEarnings {
            vehicle(tokenId: ${tokenId}) {
              tokenId
              earnings {
                totalTokens
                history(${earningsPaginationArgs}) {
                  totalCount
                  pageInfo {
                    startCursor
                    endCursor
                    hasPreviousPage
                    hasNextPage
                  }
                  edges {
                    node {
                      week
                      beneficiary
                      connectionStreak
                      streakTokens
                      aftermarketDeviceTokens
                      syntheticDeviceTokens
                      sentAt
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

      return {
        data: response.body.data,
        queryInfo: {
          queryType,
          parameters: {
            tokenId,
            ownerAddress,
            privilegedAddress,
            manufacturerName,
            manufacturerId,
            dcnName,
            nodeId,
            userAddress,
          },
          pagination: {
            first,
            last,
            after,
            before,
          },
        },
      };
    } catch (error: any) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorBody = error.response.body;
        
        throw new Error(`Identity API failed (${statusCode}): ${errorBody?.message || JSON.stringify(errorBody) || error.message}`);
      }
      
      throw new Error(`Identity API request failed: ${error.message}`);
    }
  },
}); 