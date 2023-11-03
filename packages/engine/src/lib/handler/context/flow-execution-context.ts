import { ActionType, ExecutionType, ProjectId, StepOutput, StepOutputStatus, isNil } from '@activepieces/shared'

export enum ExecutionVerdict {
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

export type EngineConstantData = {
    flowRunId: string
    serverUrl: string
    apiUrl: string
    executionType: ExecutionType
    workerToken: string
    projectId: ProjectId
    flowId: string
    resumePayload?: unknown
    baseCodeDirectory: string
}


type StepExecutionPath = {
    path: readonly [string, number][]
    loopIteration: (args: { loopName: string, iteration: number }) => StepExecutionPath
    removeLast: () => StepExecutionPath
}

export const StepExecutionPath = {
    path: [],
    loopIteration({ loopName, iteration }: { loopName: string, iteration: number }): StepExecutionPath {
        return {
            ...this,
            path: [...this.path, [loopName, iteration]],
        }
    },
    removeLast(): StepExecutionPath {
        return {
            ...this,
            path: this.path.slice(0, -1),
        }
    },
}

export type FlowExecutorContext = {
    tasks: number
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput<ActionType>>>
    currentState: Record<string, unknown>
    verdict: ExecutionVerdict
    currentPath: StepExecutionPath
    empty: () => FlowExecutorContext
    isCompleted: (args: { stepName: string }) => boolean
    addTags: (tags: string[]) => FlowExecutorContext
    upsertStep: (stepName: string, stepOutput: StepOutput) => FlowExecutorContext
    setCurrentPath: (currentStatePath: StepExecutionPath) => FlowExecutorContext
    setVerdict: (verdict: ExecutionVerdict) => FlowExecutorContext
}

export const FlowExecutorContext = {
    tasks: 0,
    currentPath: StepExecutionPath,
    tags: [],
    steps: {},
    currentState: {},
    verdict: ExecutionVerdict.RUNNING,
    empty(): FlowExecutorContext {
        return {
            ...this,
            tasks: 0,
            currentPath: StepExecutionPath,
            tags: [],
            steps: {},
            currentState: {},
            verdict: ExecutionVerdict.RUNNING,
        }
    },
    isCompleted({ stepName }: { stepName: string }): boolean {
        const stateAtPath = getStateAtPath({ currentPath: this.currentPath, steps: this.steps })
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return false
        }
        return stepOutput.status !== StepOutputStatus.PAUSED
    },
    addTags(tags: string[]): FlowExecutorContext {
        return {
            ...this,
            tags: [...this.tags, ...tags].filter((value, index, self) => {
                return self.indexOf(value) === index
            }),
        }
    },
    upsertStep(stepName: string, stepOutput: StepOutput): FlowExecutorContext {
        const steps = {
            ...this.steps,
        }
        // TODO REWRITE IT IN MORE DECLARATIVE WAY
        const targetMap = getStateAtPath({ currentPath: this.currentPath, steps })
        targetMap[stepName] = stepOutput

        return {
            ...this,
            tasks: this.tasks + 1,
            currentState: {
                ...this.currentState,
                [stepName]: stepOutput.output,
            },
            steps,
        }
    },
    setCurrentPath(currentStatePath: StepExecutionPath): FlowExecutorContext {
        return {
            ...this,
            currentPath: currentStatePath,
        }
    },
    setVerdict(verdict: ExecutionVerdict): FlowExecutorContext {
        return {
            ...this,
            verdict,
        }
    },
}



function getStateAtPath({ currentPath, steps }: { currentPath: StepExecutionPath, steps: Record<string, StepOutput<ActionType>> }): Record<string, StepOutput> {
    let targetMap = steps
    currentPath.path.forEach(([stepName, iteration]) => {
        const stepOutput = targetMap[stepName]
        if (stepOutput.type !== ActionType.LOOP_ON_ITEMS) {
            throw new Error('[ExecutionState#getTargetMap] Not instance of Loop On Items step output')
        }
        targetMap = stepOutput.output.iterations[iteration]
    })
    return targetMap
}
