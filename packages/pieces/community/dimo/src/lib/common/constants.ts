export const IDENTITY_BASE_URL = 'https://identity-api.dimo.zone';
export const TELEMETRY_BASE_URL = 'https://telemetry-api.dimo.zone';
export const TOKEN_EXCHANGE_API = 'https://token-exchange-api.dimo.zone';
export const DEVICE_DEFINIATION_API = 'https://device-definitions-api.dimo.zone';
export const ATTESTATION_API = 'https://attestation-api.dimo.zone';
export const VEHICLE_EVENTS_API = 'https://vehicle-events-api.dimo.zone';

export enum Operator {
	EQUAL = 'equal',
	GREATER_THAN = 'greater_than',
	LESS_THAN = 'less_than',
	GREATER_THAN_OR_EQUAL = 'greater_or_equal',
	LESS_THAN_OR_EQUAL = 'less_or_equal',
}

export enum TriggerField {
	Speed = 'speed',
	IsIgnitionOn = 'isIgnitionOn',
	PowertrainTransmissionTravelledDistance = 'powertrainTransmissionTravelledDistance',
	PowertrainFuelSystemRelativeLevel = 'powertrainFuelSystemRelativeLevel',
	PowertrainFuelSystemAbsoluteLevel = 'powertrainFuelSystemAbsoluteLevel',
	PowertrainTractionBatteryCurrentPower = 'powertrainTractionBatteryCurrentPower',
	PowertrainTractionBatteryChargingIsCharging = 'powertrainTractionBatteryChargingIsCharging',
	PowertrainTractionBatteryStateOfChargeCurrent = 'powertrainTractionBatteryStateOfChargeCurrent',
	ChassisAxleRow1WheelLeftTirePressure = 'chassisAxleRow1WheelLeftTirePressure',
	ChassisAxleRow1WheelRightTirePressure = 'chassisAxleRow1WheelRightTirePressure',
	ChassisAxleRow2WheelLeftTirePressure = 'chassisAxleRow2WheelLeftTirePressure',
	ChassisAxleRow2WheelRightTirePressure = 'chassisAxleRow2WheelRightTirePressure',
}

export enum TirePressurePosition {
	FRONT_LEFT = TriggerField.ChassisAxleRow1WheelLeftTirePressure,
	FRONT_RIGHT = TriggerField.ChassisAxleRow1WheelRightTirePressure,
	REAR_LEFT = TriggerField.ChassisAxleRow2WheelLeftTirePressure,
	REAR_RIGHT = TriggerField.ChassisAxleRow2WheelRightTirePressure,
}
