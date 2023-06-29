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
    PropertyType,
    StaticPropsValue,
} from "@activepieces/pieces-framework";
import fs from 'node:fs/promises';
import {
    ActionType,
    ActivepiecesError,
    ApEnvironment,
    ErrorCode,
    ExecuteActionOperation,
    ExecuteActionResponse,
    ExecuteCodeOperation,
    ExecutePropsOptions,
    ExecutionState,
    ExecutionType,
    FlowVersion,
    TriggerType,
    flowHelper,
    getPackageAliasForPiece,
} from "@activepieces/shared";
import { VariableService } from "../services/variable-service";
import { isNil } from '@activepieces/shared'
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

    const pieceModule = await import(packageName);
    const piece = Object.values<Piece>(pieceModule)[0];

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

const resolveInput = async ({ input, executionContext = {} }: ResolveInputParams): Promise<unknown> => {
    const executionState = new ExecutionState()

    for (const [stepName, stepOutput] of Object.entries(executionContext)) {
        executionState.updateLastStep(stepOutput, stepName)
    }

    const variableService = new VariableService()

    return await variableService.resolve({
        unresolvedInput: input,
        executionState,
        censorConnections: false,
    })
}

export const pieceHelper = {
    async executeCode(params: ExecuteCodeOperation): Promise<ExecuteActionResponse> {
        const { codeBase64, input, flowVersion } = params;

        const executionContext = await generateTestExecutionContext(flowVersion)
        const resolvedInput = await resolveInput({
            input,
            executionContext,
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
        } catch (e: any) {
            // Don't remove this console.error, it's used in the UI to display the error
            console.error(e);
            return {
                success: false,
                output: undefined
            };
        }
    },
    async executeAction(params: ExecuteActionOperation): Promise<ExecuteActionResponse> {
        const { actionName, pieceName, pieceVersion, input, flowVersion } = params;

        const action = await getActionOrThrow({
            pieceName,
            pieceVersion,
            actionName,
        })

        const executionContext = await generateTestExecutionContext(flowVersion)
        const resolvedInput = await resolveInput({
            input,
            executionContext,
        })
        const variableService = new VariableService()
        const { result, errors } = await variableService.validateAndCast(resolvedInput, action.props);
        if (Object.keys(errors).length > 0) {
            throw new Error(JSON.stringify(errors));
        }
        const context: ActionContext<StaticPropsValue<Record<string, any>>> = {
            executionType: ExecutionType.BEGIN,
            propsValue: result as Record<string, any>,
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
        } catch (e: any) {
            return {
                output: Utils.tryParseJson(e.message),
                success: false,
            }
        }
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


const generateTestExecutionContext = async (flowVersion: FlowVersion): Promise<Record<string, unknown>> => {
    const flowSteps = flowHelper.getAllSteps(flowVersion.trigger)
    const testContext: Record<string, unknown> = {}

    for (const step of flowSteps) {
        const stepsWithSampleData = [ActionType.CODE, ActionType.PIECE, TriggerType.PIECE, TriggerType.WEBHOOK]
        if (stepsWithSampleData.includes(step.type)) {
            const { name, settings: { inputUiInfo } } = step
            testContext[name] = inputUiInfo?.currentSelectedData
        }

        if (step.type === ActionType.LOOP_ON_ITEMS) {
            const resolvedLoopOutput: { items: any[] } = (await resolveInput({
                input: step.settings,
                executionContext: testContext
            })) as { items: any[] };
            const items = resolvedLoopOutput.items;
            testContext[step.name] = {
                index: 1,
                item: items?.[0],
            }
        }
    }

    return testContext
}
