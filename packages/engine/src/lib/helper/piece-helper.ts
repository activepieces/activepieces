import { DropdownProperty, DropdownState, Property } from "@activepieces/framework";
import { getPiece } from "@activepieces/pieces-apps";
import { ActivepiecesError, ErrorCode, ExecuteDropdownOptions, ExecutionState, PropertyType } from "@activepieces/shared";
import { VariableService } from "../services/variable-service";

export const pieceHelper = {
    async dropdownOptions(params: ExecuteDropdownOptions) {
        const property = getProperty(params);
        if (property === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.CONFIG_NOT_FOUND,
                params: {
                    stepName: params.stepName,
                    pieceName: params.pieceName,
                    configName: params.propertyName,
                },
            });
        }
        try {
            const variableService = new VariableService();
            const executionState = new ExecutionState();
            executionState.insertConfigs(params.collectionVersion);
            const resolvedInput = await variableService.resolve(params.input, executionState);
            if(property.type === PropertyType.DYNAMIC){
                return await (property as DynamicPropeties<boolean>).props(resolvedInput);
            }
            return await (property as DropdownProperty<unknown, boolean>).options(resolvedInput);
        } catch (e) {
            console.error(e);
            return {
                disabled: true,
                options: [],
                placeholder: "Throws an error, reconnect or refresh the page"
            } as DropdownState<unknown>;
        }
    }
}

function getProperty(params: ExecuteDropdownOptions){
    const component = getPiece(params.pieceName);
    if (component === undefined) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName: params.pieceName,
            },
        });
    }
    const action = component.getAction(params.stepName);
    const trigger = component.getTrigger(params.stepName);
    if (action === undefined && trigger === undefined) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                stepName: params.stepName,
                pieceName: params.pieceName,
            },
        });
    }
    const props = action !== undefined ? action.props : trigger!.props;
    return props[params.propertyName];
}