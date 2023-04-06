import { env } from 'node:process';
import {
    Action,
    ActionContext,
    DropdownProperty,
    DropdownState,
    DynamicProperties,
    DynamicPropsValue,
    MultiSelectDropdownProperty,
    Piece,
    StaticPropsValue,
} from "@activepieces/framework";
import {
    ActivepiecesError,
    ApEnvironment,
    ErrorCode,
    ExecuteActionOperation,
    ExecutePropsOptions,
    ExecutionState,
    getPackageAliasForPiece,
    PropertyType,
} from "@activepieces/shared";
import { VariableService } from "../services/variable-service";
import { getPiece } from '@activepieces/pieces-apps';
import { isNil } from 'lodash';
import { createContextStore } from '../services/storage.service';
import { globals } from '../globals';
import { connectionService } from '../services/connections.service';

type LoadPieceParams = {
    pieceName: string
    pieceVersion: string
}

type GetActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
}

const loadPieceFromDisk = async (params: LoadPieceParams): Promise<Piece | undefined> => {
    const { pieceName } = params;

    console.info(`[engine] PieceHelper#loadPieceFromDisk, pieceName=${pieceName}`);

    return getPiece(params.pieceName);
}

const loadPieceFromPackageManager = async (params: LoadPieceParams): Promise<Piece | undefined> => {
    const { pieceName, pieceVersion } = params;

    console.info(`[engine] PieceHelper#loadPieceFromPackageManager, pieceName=${pieceName} pieceVersion=${pieceVersion}`);

    const packageName = getPackageAliasForPiece({
        pieceName,
        pieceVersion,
    });

    const pieceModule = await import(packageName);
    return Object.values<Piece>(pieceModule)[0];
}

const loadPieceOrThrow = async (pieceName: string, pieceVersion: string): Promise<Piece> => {
    const apEnv = env['AP_ENVIRONMENT'];

    const pieceLoader = apEnv === ApEnvironment.DEVELOPMENT
        ? loadPieceFromDisk
        : loadPieceFromPackageManager

    const piece = await pieceLoader({
        pieceName,
        pieceVersion,
    })

    if (isNil(piece)) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName: pieceName,
                pieceVersion: pieceVersion,
            },
        });
    }

    return piece
}

const getActionOrThrow = async (params: GetActionParams): Promise<Action> => {
    const { pieceName, pieceVersion, actionName } = params;

    const piece = await loadPieceOrThrow(pieceName, pieceVersion);

    const action = piece.getAction(actionName)

    if (isNil(action)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName: pieceName,
                pieceVersion: pieceVersion,
                stepName: actionName,
            },
        });
    }

    return action;
}

const getPropOrThrow = async (params: ExecutePropsOptions) => {
    const { pieceName, pieceVersion, stepName, propertyName } = params;

    const piece = await loadPieceOrThrow(pieceName, pieceVersion);

    const action = piece.getAction(stepName) ?? piece.getTrigger(stepName)

    if (isNil(action)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName,
                pieceVersion,
                stepName,
            },
        });
    }

    const prop = action.props[propertyName]

    if (isNil(prop)) {
        throw new ActivepiecesError({
            code: ErrorCode.CONFIG_NOT_FOUND,
            params: {
                stepName,
                pieceName,
                pieceVersion,
                configName: propertyName,
            },
        })
    }

    return prop
}

type ResolveInputParams = {
    input: Record<string, unknown>
    executionContext?: Record<string, unknown>
}

const resolveInput = async ({ input, executionContext = {}}: ResolveInputParams): Promise<unknown> => {
    const executionState = new ExecutionState()

    for (const [stepName, stepOutput] of Object.entries(executionContext)) {
        executionState.updateLastStep(stepOutput, stepName)
    }

    const variableService = new VariableService()
    return await variableService.resolve(input, executionState)
}

export const pieceHelper = {
    async executeAction(params: ExecuteActionOperation): Promise<unknown> {
        const { actionName, pieceName, pieceVersion, input, testExecutionContext } = params;

        const action = await getActionOrThrow({
            pieceName,
            pieceVersion,
            actionName,
        })

        const resolvedInput = await resolveInput({
            input,
            executionContext: testExecutionContext,
        })

        const context: ActionContext<StaticPropsValue<Record<string, any>>> = {
            propsValue: resolvedInput as Record<string, any>,
            store: createContextStore('', globals.flowId),
            connections: {
              get: async (key: string) => {
                try {
                  const connection = await connectionService.obtain(key);
                  if (!connection) {
                    return null;
                  }
                  return connection;
                } catch (e) {
                  return null;
                }
              }
            }
        }

        return await action.run(context)
    },

    async executeProps(params: ExecutePropsOptions) {
        const property = await getPropOrThrow(params);

        try {
            const resolvedInput = await resolveInput({
                input: params.input,
            })

            if (property.type === PropertyType.DYNAMIC) {
                const dynamicProperty = property as DynamicProperties<boolean>
                const dynamicInput = resolvedInput as Record<string, DynamicPropsValue>
                return await dynamicProperty.props(dynamicInput);
            }

            if (property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                const multiSelectProperty = property as MultiSelectDropdownProperty<unknown, boolean>
                const multiSelectInput = resolvedInput as Record<string, any>
                return await multiSelectProperty.options(multiSelectInput);
            }

            const dropdownProperty = property as DropdownProperty<unknown, boolean>
            const dropdownInput = resolvedInput as Record<string, any>;
            return await dropdownProperty.options(dropdownInput);
        } catch (e) {
            console.error(e);
            return {
                disabled: true,
                options: [],
                placeholder: "Throws an error, reconnect or refresh the page"
            } as DropdownState<unknown>;
        }
    },

    loadPieceOrThrow,
};
