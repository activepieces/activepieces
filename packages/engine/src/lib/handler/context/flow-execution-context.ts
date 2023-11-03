import { ActionType, ExecutionOutputStatus, PauseMetadata, StepOutput, StepOutputStatus, StopResponse, isNil } from '@activepieces/shared'
import { StepExecutionPath } from './step-executiion-path'

export enum ExecutionVerdict {
    RUNNING = 'RUNNING',
    PAUSED = 'PAUSED',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
}

type VerdictResponse = {
    reason: ExecutionOutputStatus.PAUSED
    pauseMetadata: PauseMetadata | undefined
} | {
    reason: ExecutionOutputStatus.STOPPED
    stopResponse: StopResponse | undefined
}

export class FlowExecutorContext {
    tasks: number
    tags: readonly string[]
    steps: Readonly<Record<string, StepOutput<ActionType>>>
    currentState: Record<string, unknown>
    verdict: ExecutionVerdict
    verdictResponse: VerdictResponse | undefined
    currentPath: StepExecutionPath

    constructor(copyFrom?: FlowExecutorContext) {
        this.tasks = copyFrom?.tasks ?? 0
        this.tags = copyFrom?.tags ?? []
        this.steps = copyFrom?.steps ?? {}
        this.currentState = copyFrom?.currentState ?? {}
        this.verdict = copyFrom?.verdict ?? ExecutionVerdict.RUNNING
        this.verdictResponse = copyFrom?.verdictResponse ?? undefined
        this.currentPath = copyFrom?.currentPath ?? StepExecutionPath.empty()
    }
    

    static empty(): FlowExecutorContext {
        return new FlowExecutorContext()
    }

    public isCompleted({ stepName }: { stepName: string }): boolean {
        const stateAtPath = getStateAtPath({ currentPath: this.currentPath, steps: this.steps })
        const stepOutput = stateAtPath[stepName]
        if (isNil(stepOutput)) {
            return false
        }
        return stepOutput.status !== StepOutputStatus.PAUSED
    }

    public addTags(tags: string[]): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            tags: [...this.tags, ...tags].filter((value, index, self) => {
                return self.indexOf(value) === index
            }),
        })
    }

    public upsertStep(stepName: string, stepOutput: StepOutput): FlowExecutorContext {
        const steps = {
            ...this.steps,
        }
        const targetMap = getStateAtPath({ currentPath: this.currentPath, steps })
        targetMap[stepName] = stepOutput

        return new FlowExecutorContext({
            ...this,
            tasks: this.tasks + 1,
            currentState: {
                ...this.currentState,
                [stepName]: stepOutput.output,
            },
            steps,
        })
    }

    public setCurrentPath(currentStatePath: StepExecutionPath): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            currentPath: currentStatePath,
        })
    }

    public setVerdict(verdict: ExecutionVerdict, response: VerdictResponse | undefined): FlowExecutorContext {
        return new FlowExecutorContext({
            ...this,
            verdict,
            verdictResponse: response,
        })
    }
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
