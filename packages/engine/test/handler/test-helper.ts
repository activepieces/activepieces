import { ActionErrorHandlingOptions, BranchCondition, BranchExecutionType, CodeAction, FlowAction, FlowActionType, FlowVersionState, LoopOnItemsAction, PieceAction, ProgressUpdateType, PropertyExecutionType, RouterExecutionType, RunEnvironment } from '@activepieces/shared'
import { EngineConstants } from '../../src/lib/handler/context/engine-constants'
import { createPropsResolver } from '../../src/lib/variables/props-resolver'

export const generateMockEngineConstants = (params?: Partial<EngineConstants>): EngineConstants => {
    return new EngineConstants(
        {
            flowId: params?.flowId ?? 'flowId',
            flowVersionId: params?.flowVersionId ?? 'flowVersionId',
            flowVersionState: params?.flowVersionState ?? FlowVersionState.DRAFT,
            flowRunId: params?.flowRunId ?? 'flowRunId',
            publicApiUrl: params?.publicApiUrl ?? 'http://127.0.0.1:4200/api/',
            internalApiUrl: params?.internalApiUrl ?? 'http://127.0.0.1:3000/',
            retryConstants: params?.retryConstants ?? {
                maxAttempts: 2,
                retryExponential: 1,
                retryInterval: 1,
            },
            engineToken: params?.engineToken ?? 'engineToken',
            projectId: params?.projectId ?? 'projectId',
            propsResolver: params?.propsResolver ?? createPropsResolver({
                projectId: 'projectId',
                engineToken: 'engineToken',
                apiUrl: 'http://127.0.0.1:3000',
            }),
            triggerPieceName: params?.triggerPieceName ?? 'mcp-trigger-piece-name',
            progressUpdateType: params?.progressUpdateType ?? ProgressUpdateType.NONE,
            serverHandlerId: params?.serverHandlerId ?? null,
            httpRequestId: params?.httpRequestId ?? null,
            resumePayload: params?.resumePayload,
            runEnvironment: params?.runEnvironment ?? RunEnvironment.TESTING,
            testSingleStepMode: params?.testSingleStepMode ?? false,
        })
}

export function buildSimpleLoopAction({
    name,
    loopItems,
    firstLoopAction,
    skip,
}: {
    name: string
    loopItems: string
    firstLoopAction?: FlowAction
    skip?: boolean
}): LoopOnItemsAction {
    return {
        name,
        displayName: 'Loop',
        type: FlowActionType.LOOP_ON_ITEMS,
        skip: skip ?? false,
        settings: {
            items: loopItems,
        },
        firstLoopAction,
        valid: true,
    }
}

export function buildRouterWithOneCondition({ children, conditions, executionType, skip }: { children: FlowAction[], conditions: (BranchCondition | null)[], executionType: RouterExecutionType, skip?: boolean }): FlowAction {
    return {
        name: 'router',
        displayName: 'Your Router Name',
        type: FlowActionType.ROUTER,
        skip: skip ?? false,
        settings: {
            branches: conditions.map((condition) => {
                if (condition === null) {
                    return {
                        branchType: BranchExecutionType.FALLBACK,
                        branchName: 'Fallback Branch',
                    }
                }
                return {
                    conditions: [[condition]],
                    branchType: BranchExecutionType.CONDITION,
                    branchName: 'Test Branch',
                }
            }),
            executionType,
        },
        children,
        valid: true,
    }
}

export function buildCodeAction({ name, input, skip, nextAction, errorHandlingOptions }: { name: 'echo_step' | 'runtime' | 'echo_step_1', input: Record<string, unknown>, skip?: boolean, errorHandlingOptions?: ActionErrorHandlingOptions, nextAction?: FlowAction }): CodeAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: FlowActionType.CODE,
        skip: skip ?? false,
        settings: {
            input,
            sourceCode: {
                packageJson: '',
                code: '',
            },
            errorHandlingOptions,
        },
        nextAction,
        valid: true,
    }
}

export function buildPieceAction({ name, input, skip, pieceName, actionName, nextAction, errorHandlingOptions }: { errorHandlingOptions?: ActionErrorHandlingOptions, name: string, input: Record<string, unknown>, skip?: boolean, pieceName: string, actionName: string, nextAction?: FlowAction }): PieceAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: FlowActionType.PIECE,
        skip: skip ?? false,
        settings: {
            input,
            pieceName,
            pieceVersion: '1.0.0', // Not required since it's running in development mode
            actionName,
            propertySettings: Object.fromEntries(Object.entries(input).map(([key]) => [key, {
                type: PropertyExecutionType.MANUAL,
                schema: undefined,
            }])),
            errorHandlingOptions,
        },
        nextAction,
        valid: true,
    }
}
