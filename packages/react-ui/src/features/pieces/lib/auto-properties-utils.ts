import { PropertyType, PieceProperty } from "@activepieces/pieces-framework";
import { PropertyExecutionType } from "@activepieces/shared";


function determinePropertyExecutionType(property: PieceProperty): PropertyExecutionType {
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