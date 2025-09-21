import { PropertyType, PieceProperty, PiecePropertyMap } from "@activepieces/pieces-framework";
import { PropertyExecutionType } from "@activepieces/shared";


function determinePropertyExecutionType(key: string, property: PieceProperty, props: PiecePropertyMap): PropertyExecutionType {
    const isDependentProperty = Object.entries(props).filter(([_, pProperty]) => 'refreshers' in pProperty && pProperty.refreshers?.includes(key)).length > 0;
    if (isDependentProperty) {
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
    
    const requiresManualExecution = (property.required && manualExecutionTypes.includes(property.type)) || alwaysManualTypes.includes(property.type);

    return requiresManualExecution ? PropertyExecutionType.MANUAL : PropertyExecutionType.AUTO;
}

export const autoPropertiesUtils = {
    determinePropertyExecutionType,
};