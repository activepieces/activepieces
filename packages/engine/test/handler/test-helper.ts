import { Action, ActionErrorHandlingOptions, ActionType, BranchCondition, BranchExecutionType, CodeAction, FlowVersionState, LoopOnItemsAction, PieceAction, ProgressUpdateType, RouterExecutionType, RunEnvironment } from '@activepieces/shared'
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
            testSingleStepMode: params?.testSingleStepMode ?? false,
            progressUpdateType: params?.progressUpdateType ?? ProgressUpdateType.NONE,
            serverHandlerId: params?.serverHandlerId ?? null,
            httpRequestId: params?.httpRequestId ?? null,
            resumePayload: params?.resumePayload,
            runEnvironment: params?.runEnvironment ?? RunEnvironment.TESTING,
            returnResponseActionData: params?.returnResponseActionData,
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
    firstLoopAction?: Action
    skip?: boolean
}): LoopOnItemsAction {
    return {
        name,
        displayName: 'Loop',
        type: ActionType.LOOP_ON_ITEMS,
        skip: skip ?? false,
        settings: {
            items: loopItems,
            inputUiInfo: {},
        },
        firstLoopAction,
        valid: true,
    }
}

export function buildRouterWithOneCondition({ children, conditions, executionType, skip }: { children: Action[], conditions: (BranchCondition | null)[], executionType: RouterExecutionType, skip?: boolean }): Action {
    return {
        name: 'router',
        displayName: 'Your Router Name',
        type: ActionType.ROUTER,
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
            inputUiInfo: {},
        },
        children,
        valid: true,
    }
}

export function buildCodeAction({ name, input, skip, nextAction, errorHandlingOptions }: { name: 'echo_step' | 'runtime' | 'echo_step_1', input: Record<string, unknown>, skip?: boolean, errorHandlingOptions?: ActionErrorHandlingOptions, nextAction?: Action }): CodeAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: ActionType.CODE,
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

export function buildPieceAction({ name, input, skip, pieceName, actionName, nextAction, errorHandlingOptions }: { errorHandlingOptions?: ActionErrorHandlingOptions, name: string, input: Record<string, unknown>, skip?: boolean, pieceName: string, actionName: string, nextAction?: Action }): PieceAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: ActionType.PIECE,
        skip: skip ?? false,
        settings: {
            input,
            pieceName,
            pieceVersion: '1.0.0', // Not required since it's running in development mode
            actionName,
            inputUiInfo: {},
            errorHandlingOptions,
        },
        nextAction,
        valid: true,
    }
}
