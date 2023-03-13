import { env } from 'node:process';
import {
    DropdownProperty,
    DropdownState,
    DynamicProperties,
    MultiSelectDropdownProperty,
    Piece
} from "@activepieces/framework";
import {
    ActivepiecesError,
    ApEnvironment,
    ErrorCode,
    ExecutePropsOptions,
    ExecuteTriggerOperation,
    ExecutionState,
    PieceTrigger,
    PropertyType,
    TriggerHookType
} from "@activepieces/shared";
import { createContextStore } from "../services/storage.service";
import { VariableService } from "../services/variable-service";
import { getPiece } from '@activepieces/pieces-apps';

const loadPiece = async (pieceName: string): Promise<Piece | undefined> => {
    const apEnv = env['AP_ENVIRONMENT'];

    if (apEnv === ApEnvironment.DEVELOPMENT) {
        console.info(`[engine] PieceHelper#loadPiece, pieceName=${pieceName} loadMethod=local`);
        return getPiece(pieceName);
    }

    console.info(`[engine] PieceHelper#loadPiece, pieceName=${pieceName} loadMethod=npm`);
    const pieceModule = await import(`@activepieces/piece-${pieceName}`);
    return Object.values<Piece>(pieceModule)[0];
}

const getProperty = async (params: ExecutePropsOptions) => {
    const component = await loadPiece(params.pieceName);

    if (component === undefined) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName: params.pieceName,
                pieceVersion: params.pieceVersion,
            },
        });
    }

    const action = component.getAction(params.stepName);
    const trigger = component.getTrigger(params.stepName);

    if (action === undefined && trigger === undefined) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName: params.pieceName,
                pieceVersion: params.pieceVersion,
                stepName: params.stepName,
            },
        });
    }

    const props = action !== undefined ? action.props : trigger!.props;
    return props[params.propertyName];
}

export const pieceHelper = {
    async executeProps(params: ExecutePropsOptions) {
        const property = await getProperty(params);
        if (property === undefined) {
            throw new ActivepiecesError({
                code: ErrorCode.CONFIG_NOT_FOUND,
                params: {
                    stepName: params.stepName,
                    pieceName: params.pieceName,
                    pieceVersion: params.pieceVersion,
                    configName: params.propertyName,
                },
            });
        }
        try {
            const variableService = new VariableService();
            const executionState = new ExecutionState();
            const resolvedInput = await variableService.resolve(params.input, executionState);
            if (property.type === PropertyType.DYNAMIC) {
                return await (property as DynamicProperties<boolean>).props(resolvedInput);
            }
            if (property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                return await (property as MultiSelectDropdownProperty<unknown, boolean>).options(resolvedInput);
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
    },

    loadPiece,
};
