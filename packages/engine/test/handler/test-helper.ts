import { Action, ActionErrorHandlingOptions, ActionType, BranchCondition, BranchExecutionType, CodeAction, FlowVersionState, LoopOnItemsAction, PackageType, PieceAction, PieceType, ProgressUpdateType, RouterExecutionType, RunEnvironment } from '@activepieces/shared'
import { EngineConstants } from '../../src/lib/handler/context/engine-constants'
import { createPropsResolver } from '../../src/lib/variables/props-resolver'

export const generateMockEngineConstants = (params?: Partial<EngineConstants>): EngineConstants => {
    return new EngineConstants(
        params?.flowId ?? 'flowId',
        params?.flowVersionId ?? 'flowVersionId',
        params?.flowVersionState ?? FlowVersionState.DRAFT,
        params?.flowRunId ?? 'flowRunId',
        params?.publicApiUrl ?? 'http://127.0.0.1:4200/api/',
        params?.internalApiUrl ??  'http://127.0.0.1:3000/',
        params?.retryConstants ?? {
            maxAttempts: 2,
            retryExponential: 1,
            retryInterval: 1,
        },
        params?.engineToken ?? 'engineToken',
        params?.projectId ?? 'projectId',
        params?.propsResolver ?? createPropsResolver({
            projectId: 'projectId',
            engineToken: 'engineToken',
            apiUrl: 'http://127.0.0.1:3000',
        }),
        params?.testSingleStepMode ?? false,
        params?.progressUpdateType ?? ProgressUpdateType.NONE,
        params?.serverHandlerId ?? null,
        params?.httpRequestId ?? null,
        params?.resumePayload,
        params?.runEnvironment ?? RunEnvironment.TESTING,
    )
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
            packageType: PackageType.REGISTRY,
            pieceVersion: '1.0.0', // Not required since it's running in development mode
            pieceType: PieceType.OFFICIAL,
            actionName,
            inputUiInfo: {},
            errorHandlingOptions,
        },
        nextAction,
        valid: true,
    }
}
