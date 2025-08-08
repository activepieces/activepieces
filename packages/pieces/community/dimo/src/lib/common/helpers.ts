import {
	AuthenticationType,
	httpClient,
	HttpError,
	HttpMethod,
	QueryParams,
} from '@activepieces/pieces-common';
import { ethers } from 'ethers';
import {
	ATTESTATION_API,
	DEVICE_DEFINIATION_API,
	IDENTITY_BASE_URL,
	Operator,
	TELEMETRY_BASE_URL,
	TOKEN_EXCHANGE_API,
	TriggerField,
	VEHICLE_EVENTS_API,
} from './constants';
import {
	AttestationResponse,
	AuthRespone,
	CreateWebhookParams,
	DeviceDefinitionResponse,
	DeviceDefinitionsSearchResponse,
	SignatureChallenge,
	TokenExchangeResponse,
	VehicleEventTrigger,
} from './types';

export interface DimoClientOptions {
	clientId: string;
	redirectUri: string;
	apiKey: string;
}

export class DimoClient {
	private clientId: string;
	private redirectUri: string;
	private apiKey: string;

	constructor(options: DimoClientOptions) {
		this.clientId = options.clientId;
		this.redirectUri = options.redirectUri;
		this.apiKey = options.apiKey;
	}

	async generateChallenge() {
		const response = await httpClient.sendRequest<SignatureChallenge>({
			method: HttpMethod.POST,
			url: 'https://auth.dimo.zone/auth/web3/generate_challenge',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			queryParams: {
				client_id: this.clientId,
				domain: this.redirectUri,
				address: this.clientId,
				scope: 'openid email',
				response_type: 'code',
			},
		});

		return response.body;
	}

	async signChallenge(challenge: string): Promise<string> {
		const signer = new ethers.Wallet(this.apiKey);
		return await signer.signMessage(challenge);
	}

	async submitChallenge(state: string, signature: string) {
		const payload = `client_id=${this.clientId}&domain=${encodeURIComponent(
			this.redirectUri,
		)}&state=${state}&signature=${signature}&grant_type=authorization_code`;

		const response = await httpClient.sendRequest<AuthRespone>({
			method: HttpMethod.POST,
			url: 'https://auth.dimo.zone/auth/web3/submit_challenge',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: payload,
		});

		return response.body;
	}

	async getDeveloperJwt(): Promise<string> {
		const challange = await this.generateChallenge();

		const sign = await this.signChallenge(challange.challenge);

		const submit = await this.submitChallenge(challange.state, sign);

		return submit.access_token;
	}

	async createVinVC(input: { vehicleJwt: string; tokenId: number }) {
		const response = await httpClient.sendRequest<AttestationResponse>({
			method: HttpMethod.POST,
			url: ATTESTATION_API + `/v1/vc/vin/${input.tokenId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.vehicleJwt,
			},
		});

		return response.body;
	}

	async decodeVin(input: { developerJwt: string; countryCode: string; vin: string }) {
		const response = await httpClient.sendRequest<DeviceDefinitionResponse>({
			method: HttpMethod.POST,
			url: DEVICE_DEFINIATION_API + '/device-definitions/decode-vin',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
			body: {
				countryCode: input.countryCode,
				vin: input.vin,
			},
		});

		return response.body;
	}

	async deviceSearch(input: { developerJwt: string; params: QueryParams }) {
		const response = await httpClient.sendRequest<DeviceDefinitionsSearchResponse>({
			method: HttpMethod.GET,
			url: DEVICE_DEFINIATION_API + '/device-definitions/search',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
			queryParams: input.params,
		});

		return response.body;
	}

	async sendIdentityGraphQLRequest(input: { query: string; variables: Record<string, any> }) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: IDENTITY_BASE_URL + '/query',
			body: JSON.stringify({
				query: input.query,
				variables: input.variables,
			}),
		});

		return response.body;
	}

	async sendTelemetryGraphQLRequest(input: {
		vehiclejwt: string;
		query: string;
		variables: Record<string, any>;
	}) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: TELEMETRY_BASE_URL + '/query',
			body: JSON.stringify({
				query: input.query,
				variables: input.variables,
			}),
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.vehiclejwt,
			},
		});

		return response.body;
	}

	decodePermissions(permissionHex: string): number[] {
		const cleanHex = permissionHex.toLowerCase().replace('0x', '');
		const permissionBits = BigInt('0x' + cleanHex);

		const grantedPermissions: number[] = [];

		for (let i = 0; i < 128; i++) {
			const bitPair = (permissionBits >> BigInt(i * 2)) & BigInt(0b11);
			if (bitPair === BigInt(0b11)) {
				grantedPermissions.push(i);
			}
		}

		return grantedPermissions;
	}

	async getVehiclePrivileges(input: { tokenId: number }) {
		const query = `{
				vehicle(tokenId: ${input.tokenId}) {
					sacds(first:100) {
						nodes {
							permissions
							grantee
						}
					}
				}
			}`;
		const response = await this.sendIdentityGraphQLRequest({ query, variables: {} });

		const nodes = response?.data?.vehicle?.sacds?.nodes;
			if (!nodes || !Array.isArray(nodes)) {
				throw new Error('Invalid response format: missing nodes array.');
			}

		const matchingSacd = nodes.find(
			(sacd: any) => sacd.grantee.toLowerCase() === this.clientId.toLowerCase(),
		);

		if (!matchingSacd) {
			throw new Error(`No permissions found for developer license: ${this.clientId}.`);
		}
		const decodedPermissions = this.decodePermissions(matchingSacd.permissions);

		return decodedPermissions.join(',');
	}

	async getVehicleJwt(input: { developerJwt: string; tokenId: number }): Promise<string> {
		const privilegesString = await this.getVehiclePrivileges({ tokenId: input.tokenId });
		const privileges = privilegesString.split(',').map((p) => parseInt(p.trim(), 10));

		const response = await httpClient.sendRequest<TokenExchangeResponse>({
			method: HttpMethod.POST,
			url: TOKEN_EXCHANGE_API + '/v1/tokens/exchange',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
			body: {
				tokenId: input.tokenId,
				privileges,
				nftContractAddress: '0xbA5738a18d83D41847dfFbDC6101d37C69c9B0cF',
			},
		});

		return response.body.token;
	}

	async createWebhook(input: { developerJwt: string; params: CreateWebhookParams }) {
		const response = await httpClient.sendRequest<{ id: string }>({
			method: HttpMethod.POST,
			url: VEHICLE_EVENTS_API + '/v1/webhooks',
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
			body: {
				service: input.params.service,
				data: input.params.data,
				trigger: vehicleEventTriggerToText(input.params.trigger),
				setup: input.params.setup,
				description: input.params.description,
				target_uri: input.params.target_uri,
				status: input.params.status,
				verification_token: input.params.verification_token,
			},
		});

		return response.body;
	}

	async deleteWebhook(input: { developerJwt: string; webhookId: string }) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.DELETE,
			url: VEHICLE_EVENTS_API + `/v1/webhooks/${input.webhookId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
		});

		return response.body;
	}

	async subscribeVehicle(input: { developerJwt: string; webhookId: string; tokenId: string }) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: VEHICLE_EVENTS_API + `/v1/webhooks/${input.webhookId}/subscribe/${input.tokenId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
		});

		return response.body;
	}

	async subscribeAllVehicles(input: { developerJwt: string; webhookId: string }) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: VEHICLE_EVENTS_API + `/v1/webhooks/${input.webhookId}/subscribe/all`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
		});

		return response.body;
	}

	async unsubscribeAllVehicles(input: { developerJwt: string; webhookId: string }) {
		const response = await httpClient.sendRequest({
			method: HttpMethod.DELETE,
			url: VEHICLE_EVENTS_API + `/v1/webhooks/${input.webhookId}/unsubscribe/all`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: input.developerJwt,
			},
		});

		return response.body;
	}
}

export async function sendIdentityGraphQLRequest(query: string, variables: Record<string, any>) {
	try {
		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: IDENTITY_BASE_URL + '/query',
			body: JSON.stringify({
				query: query,
				variables: variables,
			}),
			headers: { 'Content-Type': 'application/json' },
		});
		return response.body;
	} catch (err) {
		const message = (err as HttpError).message;
		throw new Error(message);
	}
}

export function getNumberExpression(comparisonType: Operator, value: number): string {
	switch (comparisonType) {
		case Operator.EQUAL:
			return `valueNumber == ${value}`;
		case Operator.GREATER_THAN:
			return `valueNumber > ${value}`;
		case Operator.LESS_THAN:
			return `valueNumber < ${value}`;
		case Operator.GREATER_THAN_OR_EQUAL:
			return `valueNumber >= ${value}`;
		case Operator.LESS_THAN_OR_EQUAL:
			return `valueNumber <= ${value}`;

		default:
			throw new Error('Invalid comparison type');
	}
}

export function getBooleanExpression(value: boolean): string {
    return `valueNumber == ${value ? 1 : 0}`;
}

export function vehicleEventTriggerToText(trigger: VehicleEventTrigger): string;
export function vehicleEventTriggerToText(
	field: TriggerField,
	operator: Operator,
	triggerNumber?: number | null,
	triggerExpression?: boolean
): string;
export function vehicleEventTriggerToText(
	arg1: VehicleEventTrigger | TriggerField,
	arg2?: Operator,
	arg3?: number | null,
	arg4?: boolean
): string {
    let triggerField: TriggerField;
    let triggerOperator: Operator;
    let triggerValue: number | boolean | null = null;

	if (typeof arg1 === 'object' && 'field' in arg1 && 'operator' in arg1) {
        triggerField = arg1.field;
        triggerOperator = arg1.operator as Operator;
        triggerValue = arg1.value;
	} else {
		triggerField = arg1;
		triggerOperator = arg2!;
		triggerValue = arg3 ?? (arg4 ? true : false);
	}

	if (typeof triggerValue === 'number') {
		return getNumberExpression(triggerOperator, triggerValue);
	} else if (typeof triggerValue === 'boolean') {
		return getBooleanExpression(triggerValue);
	}

	throw new Error('Unknown trigger type');
}


export function isNumericField(field: TriggerField): boolean {
	const numericFields: TriggerField[] = [
		TriggerField.Speed,
		TriggerField.PowertrainTransmissionTravelledDistance,
		TriggerField.PowertrainFuelSystemRelativeLevel,
		TriggerField.PowertrainFuelSystemAbsoluteLevel,
		TriggerField.PowertrainTractionBatteryCurrentPower,
		TriggerField.PowertrainTractionBatteryStateOfChargeCurrent,
		TriggerField.ChassisAxleRow1WheelLeftTirePressure,
		TriggerField.ChassisAxleRow1WheelRightTirePressure,
		TriggerField.ChassisAxleRow2WheelLeftTirePressure,
		TriggerField.ChassisAxleRow2WheelRightTirePressure,
	];
	return numericFields.includes(field);
}

export function isBooleanField(field: TriggerField): boolean {
	const booleanFields: TriggerField[] = [
		TriggerField.PowertrainTractionBatteryChargingIsCharging,
        TriggerField.IsIgnitionOn,
	];
	return booleanFields.includes(field);
}

export const getTirePressurePositionLabel = (position: TriggerField): string => {
	switch (position) {
		case TriggerField.ChassisAxleRow1WheelLeftTirePressure:
			return 'Front Left';
		case TriggerField.ChassisAxleRow1WheelRightTirePressure:
			return 'Front Right';
		case TriggerField.ChassisAxleRow2WheelLeftTirePressure:
			return 'Rear Left';
		case TriggerField.ChassisAxleRow2WheelRightTirePressure:
			return 'Rear Right';
		default:
			return 'Unknown Position';
	}
};
