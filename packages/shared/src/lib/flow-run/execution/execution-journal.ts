import { FlowActionType } from "../../flows/actions/action";
import { LoopStepOutput, StepOutput } from "./step-output";

export class ExecutionJournal {
    steps: Record<string, StepOutput>

    constructor(steps?: Record<string, StepOutput>) {
        this.steps = steps ?? {}
    }

    upsertStep({ stepName, stepOutput, path }: UpsertStepParams): Record<string, StepOutput> {
        const steps = { ...this.steps }
        let target = this.getStateAtPath({ path, steps })
        target[stepName] = stepOutput
        console.log('this.steps', this.steps)

        console.log('steps', steps)
        console.log('target', target)

        return steps
    }

    getStep({ stepName, path }: GetStepParams): StepOutput | undefined {
        let target = this.getStateAtPath({ path, steps: this.steps })
        return target[stepName]
    }

    getStateAtPath({ path, steps }: GetStateAtPathParams): Record<string, StepOutput> {
      let target = steps
      for(const [parentStepName, iteration] of path) {
          const step = target[parentStepName]
          if (!step) {
              throw new Error(`Step ${parentStepName} not found in path ${path}`)
          }
          if (step.type !== FlowActionType.LOOP_ON_ITEMS) {
              throw new Error(`Step ${parentStepName} is not a loop on items step in path ${path}`)
          }
          const loopStepOutput = step as LoopStepOutput
          const iterationOutput = loopStepOutput.output?.iterations[iteration]
          if (!iterationOutput) {
              throw new Error(`Iteration ${iteration} not found in path ${path}`)
          }
          target = iterationOutput
      }
        return target
    }
}

export type UpsertStepParams = {
    stepName: string
    stepOutput: StepOutput
    path: readonly [string, number][]
}

export type GetStepParams = {
    stepName: string
    path: readonly [string, number][]
}

export type GetStateAtPathParams = {
    path: readonly [string, number][]
    steps: Record<string, StepOutput>
}
