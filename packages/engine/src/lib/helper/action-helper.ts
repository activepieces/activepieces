import { env } from 'node:process';
import {
    Action,
    ActionContext,
    DropdownProperty,
    DropdownState,
    DynamicProperties,
    MultiSelectDropdownProperty,
    Piece,
    PieceAuthProperty,
    PiecePropValueSchema,
    PiecePropertyMap,
    PropertyType,
    StaticPropsValue,
} from "@activepieces/pieces-framework";
import fs from 'node:fs/promises';
import {
    ActivepiecesError,
    ApEnvironment,
    ErrorCode,
    ExecuteActionOperation,
    ExecuteActionResponse,
    ExecuteCodeOperation,
    ExecutePropsOptions,
    ExecutionState,
    ExecutionType,
    extractPieceFromModule,
    getPackageAliasForPiece,
} from "@activepieces/shared";
import { VariableService } from "../services/variable-service";
import { isNil } from 'lodash';
import { createContextStore } from '../services/storage.service';
import { globals } from '../globals';
import { connectionService } from '../services/connections.service';
import { Utils } from '../utils';
import { codeExecutor } from '../executors/code-executer';

type GetPackageNameParams = {
    pieceName: string
    pieceVersion: string
}

type GetActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
}

const apEnv = env['AP_ENVIRONMENT'];

const getPackageName = (params: GetPackageNameParams): string => {
    const { pieceName, pieceVersion } = params;

    if (apEnv === ApEnvironment.DEVELOPMENT) {
        return pieceName;
    }
    else {
        return getPackageAliasForPiece({
            pieceName,
            pieceVersion,
        })
    }
}

const loadPieceOrThrow = async (pieceName: string, pieceVersion: string): Promise<Piece> => {
    const packageName = getPackageName({
        pieceName,
        pieceVersion,
    })

    const module = await import(packageName);
    const piece = extractPieceFromModule<Piece>({
        module,
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
    input: unknown
    executionContext?: Record<string, unknown>
}

const resolveInput = async <T = unknown>({ input, executionContext = {} }: ResolveInputParams): Promise<T> => {
    const executionState = new ExecutionState()

    for (const [stepName, stepOutput] of Object.entries(executionContext)) {
        executionState.updateLastStep(stepOutput, stepName)
    }

    const variableService = new VariableService()

    return await variableService.resolve({
        unresolvedInput: input,
        executionState,
        censorConnections: false,
    }) as T
}

export const pieceHelper = {
    async executeCode(params: ExecuteCodeOperation): Promise<ExecuteActionResponse> {
        const { codeBase64, input, testExecutionContext } = params;
        const resolvedInput = await resolveInput({
            input,
            executionContext: testExecutionContext,
        })
        try {
            const code = Buffer.from(codeBase64, 'base64').toString('utf-8');
            const fileName = `${globals.codeDirectory}/code.js`;
            await fs.mkdir(globals.codeDirectory, { recursive: true });
            await fs.writeFile(fileName, code, 'utf-8');
            const result = await codeExecutor.executeCode('code', resolvedInput);
            return {
                success: true,
                output: result,
            };
        } catch (e) {
            // Don't remove this console.error, it's used in the UI to display the error
            console.error(e);
            return {
                success: false,
                output: undefined
            };
        }
    },
    async executeAction(params: ExecuteActionOperation): Promise<ExecuteActionResponse> {
        const { actionName, pieceName, pieceVersion, authValue, propsValue, testExecutionContext } = params;

        const action = await getActionOrThrow({
            pieceName,
            pieceVersion,
            actionName,
        })

        const resolvedProps = await resolveInput<StaticPropsValue<PiecePropertyMap>>({
            input: propsValue,
            executionContext: testExecutionContext,
        })

        const resolvedAuth = await resolveInput<PiecePropValueSchema<PieceAuthProperty>>({
            input: authValue,
            executionContext: testExecutionContext,
        })

        const context: ActionContext = {
            executionType: ExecutionType.BEGIN,
            auth: resolvedAuth ?? resolvedProps['authentication'],
            propsValue: resolvedProps,
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
            },
            run: {
                stop: () => console.info('stopHook called!'),
                pause: () => console.info('pauseHook called!'),
            }
        }

        try {
            return {
                output: await action.run(context),
                success: true,
            }
        } catch (e) {
            return {
                output: e instanceof Error ? Utils.tryParseJson(e.message) : e,
                success: false,
            }
        }
    },

    async executeProps(params: ExecutePropsOptions) {
        const property = await getPropOrThrow(params);

        try {
            const resolvedProps = await resolveInput<StaticPropsValue<PiecePropertyMap>>({
                input: params.input,
            })

            const resolvedAuth = await resolveInput<PiecePropValueSchema<PieceAuthProperty>>({
                input: params.auth,
            })

            if (property.type === PropertyType.DYNAMIC) {
                const dynamicProperty = property as DynamicProperties<boolean>
                return await dynamicProperty.props(resolvedProps);
            }

            if (property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                const multiSelectProperty = property as MultiSelectDropdownProperty<unknown, boolean>
                return await multiSelectProperty.options({
                    auth: resolvedAuth,
                    propsValue: resolvedProps,
                });
            }

            const dropdownProperty = property as DropdownProperty<unknown, boolean>
            return await dropdownProperty.options({
                auth: resolvedAuth,
                propsValue: resolvedProps,
            })
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
