// Type-safe WebhookDefinition ve trigger gereksinimleri için enum/union tipleri

import { Operator } from "../helpers";
import { getNumberExpression } from '../helpers/trigger-helpers';

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
  | TriggerField.PowertrainTractionBatteryChargingIsCharging;


  export type OnOffTriggerField =
  | TriggerField.IsIgnitionOn;

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

export type OnOffTrigger = {
  field: OnOffTriggerField;
  operator: BooleanOperator;
  value: "ON" | "OFF";
};

export type VehicleEventTrigger = NumericTrigger | BooleanTrigger | OnOffTrigger;

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

export function vehicleEventTriggerToText(trigger: VehicleEventTrigger): string {
  if ('value' in trigger && typeof trigger.value === 'number') {
    // NumericTrigger
    return getNumberExpression(trigger.operator as Operator, trigger.value);
  } else if ('value' in trigger && typeof trigger.value === 'boolean') {
    // BooleanTrigger
    return `valueNumber = ${trigger.value ? 1 : 0}`;
  } else if ('value' in trigger && typeof trigger.value === 'string') {
    // OnOffTrigger
    return `valueNumber = ${trigger.value}`;
  }
  throw new Error('Unknown trigger type');
}
