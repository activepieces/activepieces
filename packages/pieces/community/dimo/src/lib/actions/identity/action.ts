import { createAction, Property } from '@activepieces/pieces-framework';
import { IdentityQueries } from '../../common/queries';
import { sendIdentityGraphQLRequest } from '../../common/helpers';

const identityApiCustomQueryAction = createAction({
	requireAuth: false,
	name: 'identity-custom-query',
	displayName: 'Identity : Custom Query',
	description: 'Custom Identity Query.',
	audience: 'both',
	aiMetadata: { description: 'Run an arbitrary GraphQL query against the public DIMO Identity API (no auth required), passing the raw query string and optional variables. Read-only escape hatch for identity/ownership data not covered by the purpose-built Identity actions; prefer a specific Identity action when one fits and use this only for custom query shapes.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the total number of vehicles registered network-wide on DIMO. Read-only, no parameters, no auth; pick this for a global vehicle count, versus Get Total Vehicle Count For Owner when you need the count for one specific owner address.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Look up details of a DIMO developer license by its numeric license token ID. Read-only and idempotent (no auth required); pick this when you have the license token ID, versus Get Vehicle By Dev License which queries by the license 0x address.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'List vehicles associated with a developer license, identified by its 0x address. Read-only and idempotent (no auth required); pick this when you have the license 0x address, versus Get Developer License Info which looks up the license itself by token ID.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the number of vehicles owned by a specific 0x Ethereum address on DIMO. Read-only and idempotent (no auth required); pick this for a per-owner count, versus Total Vehicle Count for the network-wide total or Get Owner Vehicles for the actual vehicle list.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'List the make/model/year (MMY) of every vehicle owned by a given 0x Ethereum address. Read-only and idempotent (no auth required); pick this when you have an owner address, versus Get Vehicle MMY By TokenId when you have a single vehicle token ID.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the make/model/year (MMY) for a single vehicle by its ERC-721 token ID. Read-only and idempotent (no auth required); pick this when you have one vehicle token ID, versus Get Vehicle MMY By Owner to list MMY for all of an owner\'s vehicles.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the SACD permission grants (Service Access Contract Document, i.e. what data access has been shared) for a vehicle by its ERC-721 token ID. Read-only and idempotent (no auth required); pick this to inspect a vehicle\'s data-sharing permissions for a given vehicle token ID.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the current DIMO rewards for a given 0x Ethereum owner address. Read-only and idempotent (no auth required); pick this for current/aggregate reward state, versus Get Reward History By Owner for the historical breakdown over time.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the historical DIMO reward records for a given 0x Ethereum owner address. Read-only and idempotent (no auth required); pick this for the time-series reward history, versus Get Rewards By Owner for the current reward summary.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get the device definition (make/model/year specification) for a vehicle by its ERC-721 token ID. Read-only and idempotent (no auth required); pick this when you have a vehicle token ID, versus Get Device Definition By DefinitionId when you already hold a device definition ID string.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'Get a device definition directly by its device definition ID string. Read-only and idempotent (no auth required); pick this when you already have a definition ID (e.g. from Decode VIN or a Lookup), versus Get Device Definition which resolves it from a vehicle token ID.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'List the vehicles owned by a given 0x Ethereum address, including their token IDs. Read-only and idempotent (no auth required); pick this to enumerate an owner\'s actual vehicles, versus Get Total Vehicle Count For Owner if you only need the count.', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'List the vehicles a given owner (0x address) has shared with a specific developer license (0x address), taking both addresses. Read-only and idempotent (no auth required); pick this to see the intersection of one owner\'s vehicles granted to one developer, versus Get Owner Vehicles (all of an owner\'s vehicles) or Get Vehicle By Dev License (all vehicles on a license).', idempotent: true },
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
	audience: 'both',
	aiMetadata: { description: 'List the DIMO Canonical Names (DCNs, human-readable vehicle name records) owned by a given 0x Ethereum address. Read-only and idempotent (no auth required); pick this to enumerate an owner\'s DCN name registrations by owner address.', idempotent: true },
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
