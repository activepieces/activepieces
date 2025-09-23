import { PropertyType, PieceProperty, PiecePropertyMap } from "@activepieces/pieces-framework";
import { isNil, PropertyExecutionType } from "@activepieces/shared";


function determinePropertyExecutionType(key: string, property: PieceProperty | undefined, props: PiecePropertyMap): PropertyExecutionType {
    const isDependentProperty = Object.entries(props).filter(([_, pProperty]) => 'refreshers' in pProperty && pProperty.refreshers?.includes(key)).length > 0;
    if (isDependentProperty || isNil(property)) {
        return PropertyExecutionType.MANUAL;
    }

    const manualExecutionTypes = [
        PropertyType.DYNAMIC,
        PropertyType.OAUTH2,
        PropertyType.CUSTOM_AUTH,
        PropertyType.BASIC_AUTH,
        PropertyType.CUSTOM,
        PropertyType.DROPDOWN,
    ];

    const alwaysManualTypes = [
        PropertyType.MARKDOWN
    ];
    const requiresManualExecution = alwaysManualTypes.includes(property.type) || (property.required && manualExecutionTypes.includes(property.type));
    return requiresManualExecution ? PropertyExecutionType.MANUAL : PropertyExecutionType.AUTO;
}

export const autoPropertiesUtils = {
    determinePropertyExecutionType,
};