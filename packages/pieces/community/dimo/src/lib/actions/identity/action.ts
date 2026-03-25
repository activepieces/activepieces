import { createAction, Property } from '@activepieces/pieces-framework';
import { IdentityQueries } from '../../common/queries';
import { sendIdentityGraphQLRequest } from '../../common/helpers';

const identityApiCustomQueryAction = createAction({
	requireAuth: false,
	name: 'identity-custom-query',
	displayName: 'Identity : Custom Query',
	description: 'Custom Identity Query.',
	props: {
		customQuery: Property.LongText({
			displayName: 'Custom GraphQL Query',
			required: true,
		}),
		variables: Property.Json({
			displayName: 'Variables',
			required: false,
		}),
	},
	async run(context) {
		const { customQuery, variables = {} } = context.propsValue;
		if (!customQuery) {
			throw new Error('Custom GraphQL query is required.');
		}

		return await sendIdentityGraphQLRequest(customQuery, variables);
	},
});

const totalVehicleCountAction = createAction({
	requireAuth: false,
	name: 'identity-total-vehicle-count',
	displayName: 'Identity : Total Vehicle Count',
	description: 'Get total vehicle count.',
	props: {},
	async run() {
		return await sendIdentityGraphQLRequest(IdentityQueries.generalInfo, {});
	},
});

const getDeveloperLicenseInfoAction = createAction({
	requireAuth: false,
	name: 'identity-get-developer-license-info',
	displayName: 'Identity : Get Developer License Info',
	description: 'Get developer license info by tokenId.',
	props: {
		devLicenseTokenId: Property.Number({
			displayName: 'Developer License Token ID',
			description: 'Token ID of the developer license.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getDeveloperLicenseInfo.replace(
			/<devLicenseTokenId>/g,
			String(context.propsValue.devLicenseTokenId),
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getVehicleByDevLicenseAction = createAction({
	requireAuth: false,
	name: 'identity-get-vehicle-by-dev-license',
	displayName: 'Identity : Get Vehicle By Dev License',
	description: 'Get vehicles by developer license 0x address.',
	props: {
		devLicense0x: Property.ShortText({
			displayName: 'Dev License 0x',
			description: '0x address for developer license.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getVehicleByDevLicense.replace(
			/<devLicense0x>/g,
			context.propsValue.devLicense0x,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getTotalVehicleCountForOwnerAction = createAction({
	requireAuth: false,
	name: 'identity-get-total-vehicle-count-for-owner',
	displayName: 'Identity : Get Total Vehicle Count For Owner.',
	description: 'Get total vehicle count for an owner.',
	props: {
		ownerAddress: Property.ShortText({
			displayName: 'Owner Address',
			description: '0x Ethereum address of the owner.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getTotalVehicleCountForOwner.replace(
			/<ownerAddress>/g,
			context.propsValue.ownerAddress,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getVehicleMMYByOwnerAction = createAction({
	requireAuth: false,
	name: 'identity-get-vehicle-mmy-by-owner',
	displayName: 'Identity : Get Vehicle MMY By Owner',
	description: 'Get vehicle MMY by owner address.',
	props: {
		ownerAddress: Property.ShortText({
			displayName: 'Owner Address',
			description: '0x Ethereum address of the owner.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getVehicleMMYByOwner.replace(
			/<ownerAddress>/g,
			context.propsValue.ownerAddress,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getVehicleMMYByTokenIdAction = createAction({
	requireAuth: false,
	name: 'identity-get-vehicle-mmy-by-tokenid',
	displayName: 'Identity : Get Vehicle MMY By TokenId',
	description: 'Get vehicle MMY by tokenId.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ERC-721 token ID of the vehicle.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getVehicleMMYByTokenId.replace(
			/<vehicleTokenId>/g,
			String(context.propsValue.vehicleTokenId),
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getSacdForVehicleAction = createAction({
	requireAuth: false,
	name: 'identity-get-sacd-for-vehicle',
	displayName: 'Identity : Get SACD For Vehicle',
	description: 'Get SACD for a vehicle by tokenId.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ERC-721 token ID of the vehicle.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getSacdForVehicle.replace(
			/<vehicleTokenId>/g,
			String(context.propsValue.vehicleTokenId),
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getRewardsByOwnerAction = createAction({
	requireAuth: false,
	name: 'identity-get-rewards-by-owner',
	displayName: 'Identity : Get Rewards By Owner',
	description: 'Get rewards by owner address.',
	props: {
		ownerAddress: Property.ShortText({
			displayName: 'Owner Address',
			description: '0x Ethereum address of the owner.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getRewardsByOwner.replace(
			/<ownerAddress>/g,
			context.propsValue.ownerAddress,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getRewardHistoryByOwnerAction = createAction({
	requireAuth: false,
	name: 'identity-get-reward-history-by-owner',
	displayName: 'Identity : Get Reward History By Owner',
	description: 'Get reward history by owner address.',
	props: {
		ownerAddress: Property.ShortText({
			displayName: 'Owner Address',
			description: '0x Ethereum address of the owner.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getRewardHistoryByOwner.replace(
			/<ownerAddress>/g,
			context.propsValue.ownerAddress,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getDeviceDefinitionByTokenIdAction = createAction({
	requireAuth: false,
	name: 'identity-get-device-definition-by-tokenid',
	displayName: 'Identity : Get Device Definition',
	description: 'Get device definition by vehicle tokenId.',
	props: {
		vehicleTokenId: Property.Number({
			displayName: 'Vehicle Token ID',
			description: 'The ERC-721 token ID of the vehicle',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getDeviceDefinitionByTokenId.replace(
			/<vehicleTokenId>/g,
			String(context.propsValue.vehicleTokenId),
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getDeviceDefinitionByDefinitionIdAction = createAction({
	requireAuth: false,
	name: 'identity-get-device-definition-by-definitionid',
	displayName: 'Identity : Get Device Definition By DefinitionId',
	description: 'Get device definition by definitionId.',
	props: {
		deviceDefinitionId: Property.ShortText({
			displayName: 'Device Definition ID',
			description: 'ID of the device definition.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getDeviceDefinitionByDefinitionId.replace(
			/<deviceDefinitionId>/g,
			context.propsValue.deviceDefinitionId,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getOwnerVehiclesAction = createAction({
	requireAuth: false,
	name: 'identity-get-owner-vehicles',
	displayName: 'Identity : Get Owner Vehicles',
	description: 'Get vehicles owned by an address.',
	props: {
		ownerAddress: Property.ShortText({
			displayName: 'Owner Address',
			description: '0x Ethereum address of the owner',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getOwnerVehicles.replace(
			/<ownerAddress>/g,
			context.propsValue.ownerAddress,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getDeveloperSharedVehiclesFromOwnerAction = createAction({
	requireAuth: false,
	name: 'identity-get-developer-shared-vehicles-from-owner',
	displayName: 'Identity : Get Developer Shared Vehicles From Owner',
	description: 'Get vehicles shared with a developer license from an owner.',
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
		const query = IdentityQueries.getDeveloperSharedVehiclesFromOwner
			.replace(/<devLicense0x>/g, context.propsValue.devLicense0x)
			.replace(/<ownerAddress>/g, context.propsValue.ownerAddress);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

const getDCNsByOwnerAction = createAction({
	requireAuth: false,
	name: 'identity-get-dcns-by-owner',
	displayName: 'Identity : Get DCNs By Owner',
	description: 'Get DCNs by owner address.',
	props: {
		ownerAddress: Property.ShortText({
			displayName: 'Owner Address',
			description: '0x Ethereum address of the owner.',
			required: true,
		}),
	},
	async run(context) {
		const query = IdentityQueries.getDCNsByOwner.replace(
			/<ownerAddress>/g,
			context.propsValue.ownerAddress,
		);
		return await sendIdentityGraphQLRequest(query, {});
	},
});

export const identityApiActions = [
	identityApiCustomQueryAction,
	totalVehicleCountAction,
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
];
