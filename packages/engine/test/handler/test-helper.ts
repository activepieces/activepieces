import { Action, ActionErrorHandlingOptions, ActionType, BranchCondition, BranchExecutionType, CodeAction, FlowVersionState, LoopOnItemsAction, PackageType, PieceAction, PieceType, ProgressUpdateType, RouterExecutionType } from '@activepieces/shared'
import { EngineConstants } from '../../src/lib/handler/context/engine-constants'
import { createPropsResolver } from '../../src/lib/variables/props-resolver'

export const generateMockEngineConstants = (params?: Partial<EngineConstants>): EngineConstants => {
    return new EngineConstants(
        params?.flowId ?? 'flowId',
        params?.flowVersionId ?? 'flowVersionId',
        params?.flowVersionState ?? FlowVersionState.DRAFT,
        params?.flowRunId ?? 'flowRunId',
        params?.publicUrl ?? 'http://127.0.0.1:3000',
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
    )
}

export function buildSimpleLoopAction({
    name,
    loopItems,
    firstLoopAction,
}: {
    name: string
    loopItems: string
    firstLoopAction?: Action
}): LoopOnItemsAction {
    return {
        name,
        displayName: 'Loop',
        type: ActionType.LOOP_ON_ITEMS,
        settings: {
            items: loopItems,
            inputUiInfo: {},
        },
        firstLoopAction,
        valid: true,
    }
}

export function buildRouterWithOneCondition({ children, conditions, executionType }: { children: Action[], conditions: (BranchCondition | null)[], executionType: RouterExecutionType }): Action {
    return {
        name: 'router',
        displayName: 'Your Router Name',
        type: ActionType.ROUTER,
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

export function buildCodeAction({ name, input, nextAction, errorHandlingOptions }: { name: 'echo_step' | 'runtime' | 'echo_step_1', input: Record<string, unknown>, errorHandlingOptions?: ActionErrorHandlingOptions, nextAction?: Action }): CodeAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: ActionType.CODE,
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

export function buildPieceAction({ name, input, pieceName, actionName, nextAction, errorHandlingOptions }: { errorHandlingOptions?: ActionErrorHandlingOptions, name: string, input: Record<string, unknown>, nextAction?: Action, pieceName: string, actionName: string }): PieceAction {
    return {
        name,
        displayName: 'Your Action Name',
        type: ActionType.PIECE,
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
