import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { IDENTITY_BASE_URL, commonQueries } from './constant';
import { handleFailures } from '../../helpers';

// Ortak GraphQL request helper
async function sendGraphQLRequest(query: string) {
  const response = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: IDENTITY_BASE_URL,
    body: { query },
    headers: { 'Content-Type': 'application/json' },
  });

  handleFailures(response);

  return {
    body : response.body
  }
}

export const identityApiCustomQueryAction = createAction({
  requireAuth: false,
  name: 'identity-api-custom-query',
  displayName: 'Identity API (Custom GraphQL)',
  description: 'Query DIMO Identity API using a custom GraphQL query (no authentication required)',
  props: {
    customQuery: Property.LongText({
      displayName: 'Custom GraphQL Query',
      description: 'Enter your GraphQL query here',
      required: true,
    }),
  },
  async run(context) {
    const { customQuery } = context.propsValue;
    if (!customQuery) {
      throw new Error('Custom GraphQL query is required.');
    }
    return await sendGraphQLRequest(customQuery);
  },
});

export const generalInfoAction = createAction({
  requireAuth: false,
  name: 'identity-general-info',
  displayName: 'Identity: General Info',
  description: 'Get total vehicle count',
  props: {},
  async run() {
    return await sendGraphQLRequest(commonQueries.generalInfo);
  },
});

export const getDeveloperLicenseInfoAction = createAction({
  requireAuth: false,
  name: 'identity-get-developer-license-info',
  displayName: 'Identity: Get Developer License Info',
  description: 'Get developer license info by tokenId',
  props: {
    devLicenseTokenId: Property.Number({
      displayName: 'Developer License Token ID',
      description: 'Token ID of the developer license',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getDeveloperLicenseInfo.replace(/<devLicenseTokenId>/g, String(context.propsValue.devLicenseTokenId));
    return await sendGraphQLRequest(query);
  },
});

export const getVehicleByDevLicenseAction = createAction({
  requireAuth: false,
  name: 'identity-get-vehicle-by-dev-license',
  displayName: 'Identity: Get Vehicle By Dev License',
  description: 'Get vehicles by developer license 0x address',
  props: {
    devLicense0x: Property.ShortText({
      displayName: 'Dev License 0x',
      description: '0x address for developer license',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getVehicleByDevLicense.replace(/<devLicense0x>/g, context.propsValue.devLicense0x);
    return await sendGraphQLRequest(query);
  },
});

export const getTotalVehicleCountForOwnerAction = createAction({
  requireAuth: false,
  name: 'identity-get-total-vehicle-count-for-owner',
  displayName: 'Identity: Get Total Vehicle Count For Owner',
  description: 'Get total vehicle count for an owner',
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getTotalVehicleCountForOwner.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});

export const getVehicleMMYByOwnerAction = createAction({
  requireAuth: false,
  name: 'identity-get-vehicle-mmy-by-owner',
  displayName: 'Identity: Get Vehicle MMY By Owner',
  description: 'Get vehicle MMY by owner address',
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getVehicleMMYByOwner.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});

export const getVehicleMMYByTokenIdAction = createAction({
  requireAuth: false,
  name: 'identity-get-vehicle-mmy-by-tokenid',
  displayName: 'Identity: Get Vehicle MMY By TokenId',
  description: 'Get vehicle MMY by tokenId',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getVehicleMMYByTokenId.replace(/<vehicleTokenId>/g, String(context.propsValue.vehicleTokenId));
    return await sendGraphQLRequest(query);
  },
});

export const getSacdForVehicleAction = createAction({
  requireAuth: false,
  name: 'identity-get-sacd-for-vehicle',
  displayName: 'Identity: Get SACD For Vehicle',
  description: 'Get SACD for a vehicle by tokenId',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getSacdForVehicle.replace(/<vehicleTokenId>/g, String(context.propsValue.vehicleTokenId));
    return await sendGraphQLRequest(query);
  },
});

export const getRewardsByOwnerAction = createAction({
  requireAuth: false,
  name: 'identity-get-rewards-by-owner',
  displayName: 'Identity: Get Rewards By Owner',
  description: 'Get rewards by owner address',
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getRewardsByOwner.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});

export const getRewardHistoryByOwnerAction = createAction({
  requireAuth: false,
  name: 'identity-get-reward-history-by-owner',
  displayName: 'Identity: Get Reward History By Owner',
  description: 'Get reward history by owner address',
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getRewardHistoryByOwner.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});

export const getDeviceDefinitionByTokenIdAction = createAction({
  requireAuth: false,
  name: 'identity-get-device-definition-by-tokenid',
  displayName: 'Identity: Get Device Definition By TokenId',
  description: 'Get device definition by vehicle tokenId',
  props: {
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'The ERC-721 token ID of the vehicle',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getDeviceDefinitionByTokenId.replace(/<vehicleTokenId>/g, String(context.propsValue.vehicleTokenId));
    return await sendGraphQLRequest(query);
  },
});

export const getDeviceDefinitionByDefinitionIdAction = createAction({
  requireAuth: false,
  name: 'identity-get-device-definition-by-definitionid',
  displayName: 'Identity: Get Device Definition By DefinitionId',
  description: 'Get device definition by definitionId',
  props: {
    deviceDefinitionId: Property.ShortText({
      displayName: 'Device Definition ID',
      description: 'ID of the device definition',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getDeviceDefinitionByDefinitionId.replace(/<deviceDefinitionId>/g, context.propsValue.deviceDefinitionId);
    return await sendGraphQLRequest(query);
  },
});

export const getOwnerVehiclesAction = createAction({
  requireAuth: false,
  name: 'identity-get-owner-vehicles',
  displayName: 'Identity: Get Owner Vehicles',
  description: 'Get vehicles owned by an address',
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getOwnerVehicles.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});

export const getDeveloperSharedVehiclesFromOwnerAction = createAction({
  requireAuth: false,
  name: 'identity-get-developer-shared-vehicles-from-owner',
  displayName: 'Identity: Get Developer Shared Vehicles From Owner',
  description: 'Get vehicles shared with a developer license from an owner',
  props: {
    devLicense0x: Property.ShortText({
      displayName: 'Dev License 0x',
      description: '0x address for developer license',
      required: true,
    }),
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getDeveloperSharedVehiclesFromOwner
      .replace(/<devLicense0x>/g, context.propsValue.devLicense0x)
      .replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});

export const getDCNsByOwnerAction = createAction({
  requireAuth: false,
  name: 'identity-get-dcns-by-owner',
  displayName: 'Identity: Get DCNs By Owner',
  description: 'Get DCNs by owner address',
  props: {
    ownerAddress: Property.ShortText({
      displayName: 'Owner Address',
      description: '0x Ethereum address of the owner',
      required: true,
    }),
  },
  async run(context) {
    const query = commonQueries.getDCNsByOwner.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
    return await sendGraphQLRequest(query);
  },
});


export const identityApiActions = [
  identityApiCustomQueryAction,
  generalInfoAction,
  getDeveloperLicenseInfoAction,
  getVehicleByDevLicenseAction,
  getTotalVehicleCountForOwnerAction,
  getVehicleMMYByOwnerAction,
  getVehicleMMYByTokenIdAction,
  getSacdForVehicleAction,
  getRewardsByOwnerAction,
  getRewardHistoryByOwnerAction,
  getDeviceDefinitionByTokenIdAction,
  getDeviceDefinitionByDefinitionIdAction,
  getOwnerVehiclesAction,
  getDeveloperSharedVehiclesFromOwnerAction,
  getDCNsByOwnerAction,
]
