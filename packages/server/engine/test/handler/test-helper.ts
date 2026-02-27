import { ActionErrorHandlingOptions, BranchCondition, BranchExecutionType, CodeAction, FlowAction, FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState, LoopOnItemsAction, PieceAction, ProgressUpdateType, PropertyExecutionType, RouterAction, RouterExecutionType, RunEnvironment } from '@activepieces/shared'
import { EngineConstants } from '../../src/lib/handler/context/engine-constants'

export const generateMockEngineConstants = (params?: Partial<EngineConstants>): EngineConstants => {
    return new EngineConstants(
        {
            platformId: params?.platformId ?? 'platformId',
            timeoutInSeconds: params?.timeoutInSeconds ?? 10,
            flowId: params?.flowId ?? 'flowId',
            flowVersionId: params?.flowVersionId ?? 'flowVersionId',
            triggerPieceName: params?.triggerPieceName ?? 'mcp-trigger-piece-name',
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
            progressUpdateType: params?.progressUpdateType ?? ProgressUpdateType.NONE,
            serverHandlerId: params?.serverHandlerId ?? null,
            httpRequestId: params?.httpRequestId ?? null,
            resumePayload: params?.resumePayload,
            runEnvironment: params?.runEnvironment ?? RunEnvironment.TESTING,
            stepNameToTest: params?.stepNameToTest ?? undefined,
            stepNames: params?.stepNames ?? [],
            flowVersion: params?.flowVersion,
        })
}

export function buildSimpleLoopAction({
    name,
    loopItems,
    children,
    skip,
}: {
    name: string
    loopItems: string
    children?: string[]
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
        children,
        valid: true,
    }
}

export function buildRouterWithOneCondition({ branchStepNames, conditions, executionType, skip }: { branchStepNames: string[][], conditions: (BranchCondition | null)[], executionType: RouterExecutionType, skip?: boolean }): RouterAction {
    return {
        name: 'router',
        displayName: 'Your Router Name',
        type: FlowActionType.ROUTER,
        skip: skip ?? false,
        settings: {
            executionType,
        },
        branches: conditions.map((condition, index) => {
            if (condition === null) {
                return {
                    branchType: BranchExecutionType.FALLBACK as const,
                    branchName: 'Fallback Branch',
                    steps: branchStepNames?.[index] ?? [],
                }
            }
            return {
                conditions: [[condition]],
                branchType: BranchExecutionType.CONDITION as const,
                branchName: 'Test Branch',
                steps: branchStepNames?.[index] ?? [],
            }
        }),
        valid: true,
    }
}

export function buildCodeAction({ name, input, skip, errorHandlingOptions }: { name: string, input: Record<string, unknown>, skip?: boolean, errorHandlingOptions?: ActionErrorHandlingOptions }): CodeAction {
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
        valid: true,
    }
}

export function buildPieceAction({ name, input, skip, pieceName, actionName, errorHandlingOptions }: { errorHandlingOptions?: ActionErrorHandlingOptions, name: string, input: Record<string, unknown>, skip?: boolean, pieceName: string, actionName: string }): PieceAction {
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
        valid: true,
    }
}

export function buildFlowVersion(steps: FlowAction[], triggerSteps?: string[]): FlowVersion {
    return {
        id: 'flowVersionId',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        flowId: 'test-flow-id',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger',
            valid: true,
            displayName: 'Test Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            steps: triggerSteps ?? [],
        },
        steps,
        updatedBy: null,
        valid: true,
        schemaVersion: null,
        agentIds: [],
        state: FlowVersionState.DRAFT,
        connectionIds: [],
        backupFiles: null,
        notes: [],
    }
}
