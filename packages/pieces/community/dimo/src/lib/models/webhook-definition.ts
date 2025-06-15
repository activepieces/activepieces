// Type-safe WebhookDefinition ve trigger gereksinimleri için enum/union tipleri

import { Operator } from "../helpers";

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

export type BooleanTriggerField =
  | TriggerField.IsIgnitionOn
  | TriggerField.PowertrainTractionBatteryChargingIsCharging;

export type NumericOperator = Operator

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

export interface WebhookDefinition {
  service: "Telemetry";
  data: TriggerField;
  trigger: VehicleEventTrigger;
  setup: "Realtime" | "Hourly"
  description?: string;
  targetUri: string;
  status: 'Active' | 'Inactive';
}

export interface TriggerInput {
  triggerType: TriggerField;
  operator: NumericOperator | BooleanOperator;
  value: number | boolean;
  vehicleIds?: string[];
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

export interface WebhookVerificationRequest {
  verification: string
}
