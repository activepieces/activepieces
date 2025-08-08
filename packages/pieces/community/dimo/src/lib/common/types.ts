import { Operator, TriggerField } from './constants';

export interface DeviceDefinitionResponse {
	deviceDefinitionId: string;
	newTransactionHash: string;
}

export interface DeviceDefinitionsSearchResponse {
	deviceDefinitions: Array<{
		id: string;
		legacy_ksuid: string;
		name: string;
		make: string;
		model: string;
		year: number;
		imageUrl: string;
	}>;
	facets: {
		makes: Array<{ name: string; count: number }>;
		models: Array<{ name: string; count: number }>;
		years: Array<{ name: string; count: number }>;
	};
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface AttestationResponse {
	vcUrl: string;
	vcQuery: string;
	message: string;
}

export interface SignatureChallenge {
	challenge: string;
	state: string;
}

export interface AuthRespone {
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token?: string;
	id_token?: string;
}

export interface TokenExchangeResponse {
	token: string;
}

export type NumericTriggerField =
	| TriggerField.Speed
	| TriggerField.PowertrainTransmissionTravelledDistance
	| TriggerField.PowertrainFuelSystemRelativeLevel
	| TriggerField.PowertrainFuelSystemAbsoluteLevel
	| TriggerField.PowertrainTractionBatteryCurrentPower
	| TriggerField.PowertrainTractionBatteryStateOfChargeCurrent
	| TriggerField.ChassisAxleRow1WheelLeftTirePressure
	| TriggerField.ChassisAxleRow1WheelRightTirePressure
	| TriggerField.ChassisAxleRow2WheelLeftTirePressure
	| TriggerField.ChassisAxleRow2WheelRightTirePressure;

export type BooleanTriggerField = TriggerField.PowertrainTractionBatteryChargingIsCharging | TriggerField.IsIgnitionOn

export type NumericOperator = Operator;

export enum BooleanOperator {
	Is = 'Is',
}

export type NumericTrigger = {
	field: NumericTriggerField;
	operator: NumericOperator;
	value: number;
};

export type BooleanTrigger = {
	field: BooleanTriggerField;
	operator: BooleanOperator;
	value: boolean;
};

export type VehicleEventTrigger = NumericTrigger | BooleanTrigger;

export interface CreateWebhookParams {
	service: 'Telemetry';
	data: TriggerField;
	trigger: VehicleEventTrigger;
	setup: 'Realtime' | 'Hourly';
	description?: string;
	target_uri: string;
	status: 'Active' | 'Inactive';
	verification_token: string;
}

export interface WebhookInfo {
	webhookId: string;
	verificationToken: string;
}

export interface WebhookPayload {
	tokenId: number;
	timestamp: string;
	name: string;
	valueNumber: number;
	valueString: string;
	source: string;
	producer: string;
	cloudEventId: string;
}
