export enum TriggerComparisonType {
  EQUAL = 'equal',
  GREATER_THAN = 'greater',
  GREATER_EQUAL = 'greater_equal',
  LESS_THAN = 'less',
  LESS_EQUAL = 'less_equal',
}

export function getTriggerCondition(comparisonType: TriggerComparisonType, value: number): string {
  switch (comparisonType) {
    case TriggerComparisonType.EQUAL:
      return `valueNumber = ${value}`;
    case TriggerComparisonType.GREATER_THAN:
      return `valueNumber > ${value}`;
    case TriggerComparisonType.GREATER_EQUAL:
      return `valueNumber >= ${value}`;
    case TriggerComparisonType.LESS_THAN:
      return `valueNumber < ${value}`;
    case TriggerComparisonType.LESS_EQUAL:
      return `valueNumber <= ${value}`;
    default:
      throw new Error(`Unsupported comparison type: ${comparisonType}`);
  }
}

export enum TirePressurePosition {
  FRONT_LEFT = 'chassisAxleRow1WheelLeftTirePressure',
  FRONT_RIGHT = 'chassisAxleRow1WheelRightTirePressure',
  REAR_LEFT = 'chassisAxleRow2WheelLeftTirePressure',
  REAR_RIGHT = 'chassisAxleRow2WheelRightTirePressure',
}

export const getTirePressurePositionLabel = (position: TirePressurePosition): string => {
  switch (position) {
    case TirePressurePosition.FRONT_LEFT:
      return 'Front Left';
    case TirePressurePosition.FRONT_RIGHT:
      return 'Front Right';
    case TirePressurePosition.REAR_LEFT:
      return 'Rear Left';
    case TirePressurePosition.REAR_RIGHT:
      return 'Rear Right';
    default:
      return 'Unknown Position';
  }
}; 