import { ActionErrorHandlingOptions, BranchCondition, BranchExecutionType, CodeAction, FlowAction, FlowActionKind, FlowEdgeType, FlowGraphEdge, FlowGraphNode, FlowNodeType, FlowTriggerKind, FlowVersion, FlowVersionState, LoopOnItemsAction, PieceAction, ProgressUpdateType, PropertyExecutionType, RouterAction, RouterExecutionType, RunEnvironment } from '@activepieces/shared'
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
}): LoopOnItemsAction & TestMeta {
    return {
        name,
        displayName: 'Loop',
        kind: FlowActionKind.LOOP_ON_ITEMS,
        skip: skip ?? false,
        settings: {
            items: loopItems,
        },
        valid: true,
        _loopChildren: children,
    }
}

export function buildRouterWithOneCondition({ branchStepNames, conditions, executionType, skip }: { branchStepNames: string[][], conditions: (BranchCondition | null)[], executionType: RouterExecutionType, skip?: boolean }): RouterAction & TestMeta {
    return {
        name: 'router',
        displayName: 'Your Router Name',
        kind: FlowActionKind.ROUTER,
        skip: skip ?? false,
        settings: {
            executionType,
        },
        valid: true,
        _branches: conditions.map((condition, index) => {
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
    }
}

export function buildCodeAction({ name, input, skip, errorHandlingOptions }: { name: string, input: Record<string, unknown>, skip?: boolean, errorHandlingOptions?: ActionErrorHandlingOptions }): CodeAction & TestMeta {
    return {
        name,
        displayName: 'Your Action Name',
        kind: FlowActionKind.CODE,
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

export function buildPieceAction({ name, input, skip, pieceName, actionName, errorHandlingOptions }: { errorHandlingOptions?: ActionErrorHandlingOptions, name: string, input: Record<string, unknown>, skip?: boolean, pieceName: string, actionName: string }): PieceAction & TestMeta {
    return {
        name,
        displayName: 'Your Action Name',
        kind: FlowActionKind.PIECE,
        skip: skip ?? false,
        settings: {
            input,
            pieceName,
            pieceVersion: '1.0.0',
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

export function buildFlowVersion(steps: Array<FlowAction & TestMeta>, triggerSteps?: string[]): FlowVersion {
    const triggerNode: FlowGraphNode = {
        id: 'trigger',
        type: FlowNodeType.TRIGGER,
        data: {
            kind: FlowTriggerKind.EMPTY,
            name: 'trigger',
            valid: true,
            displayName: 'Test Trigger',
            settings: {},
        },
    }

    const nodes: FlowGraphNode[] = [triggerNode]
    const edges: FlowGraphEdge[] = []

    for (const step of steps) {
        nodes.push({
            id: step.name,
            type: FlowNodeType.ACTION,
            data: stripMeta(step),
        })
    }

    if (triggerSteps && triggerSteps.length > 0) {
        edges.push({
            id: 'trigger-default',
            source: 'trigger',
            target: triggerSteps[0],
            type: FlowEdgeType.DEFAULT,
        })
        for (let i = 0; i < triggerSteps.length - 1; i++) {
            edges.push({
                id: `${triggerSteps[i]}-default`,
                source: triggerSteps[i],
                target: triggerSteps[i + 1],
                type: FlowEdgeType.DEFAULT,
            })
        }
    }

    for (const step of steps) {
        if (step._loopChildren && step._loopChildren.length > 0) {
            edges.push({
                id: `${step.name}-loop`,
                source: step.name,
                target: step._loopChildren[0],
                type: FlowEdgeType.LOOP,
            })
            for (let i = 0; i < step._loopChildren.length - 1; i++) {
                edges.push({
                    id: `${step._loopChildren[i]}-default`,
                    source: step._loopChildren[i],
                    target: step._loopChildren[i + 1],
                    type: FlowEdgeType.DEFAULT,
                })
            }
        }

        if (step._branches) {
            step._branches.forEach((branch, index) => {
                const target = branch.steps.length > 0 ? branch.steps[0] : null
                edges.push({
                    id: `${step.name}-branch-${index}`,
                    source: step.name,
                    target,
                    type: FlowEdgeType.BRANCH,
                    branchIndex: index,
                    branchName: branch.branchName,
                    branchType: branch.branchType,
                    conditions: branch.conditions,
                })
                for (let i = 0; i < branch.steps.length - 1; i++) {
                    edges.push({
                        id: `${branch.steps[i]}-default`,
                        source: branch.steps[i],
                        target: branch.steps[i + 1],
                        type: FlowEdgeType.DEFAULT,
                    })
                }
            })
        }
    }

    return {
        id: 'flowVersionId',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        flowId: 'test-flow-id',
        displayName: 'Test Flow',
        graph: { nodes, edges },
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

function stripMeta(action: FlowAction & TestMeta): FlowAction {
    const { _loopChildren: _1, _branches: _2, ...data } = action
    return data as FlowAction
}

type TestMeta = {
    _loopChildren?: string[]
    _branches?: TestBranch[]
}

type TestBranch = {
    branchType: BranchExecutionType
    branchName: string
    conditions?: BranchCondition[][]
    steps: string[]
}
