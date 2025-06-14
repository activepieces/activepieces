export enum TirePressurePosition
{
    FRONT_LEFT = 'front_left',
    FRONT_RIGHT = 'front_right',
    REAR_LEFT = 'rear_left',
    REAR_RIGHT = 'rear_right',
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
}
