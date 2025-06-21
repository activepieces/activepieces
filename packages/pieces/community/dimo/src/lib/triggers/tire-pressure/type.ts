import { TriggerField } from "../../models";

export enum TirePressurePosition
{
    FRONT_LEFT = TriggerField.ChassisAxleRow1WheelLeftTirePressure,
    FRONT_RIGHT = TriggerField.ChassisAxleRow1WheelRightTirePressure,
    REAR_LEFT = TriggerField.ChassisAxleRow2WheelLeftTirePressure,
    REAR_RIGHT = TriggerField.ChassisAxleRow2WheelRightTirePressure,
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
}
