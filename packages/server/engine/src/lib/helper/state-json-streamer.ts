import { isNil, JsonFragment, jsonStreamUtils } from '@activepieces/core-utils'
import { FLOW_RUN_LOG_MANIFEST_V2, FlowActionType, LoopStepResult, StepOutput } from '@activepieces/shared'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'

const { jsonObject, jsonArray, definedEntries } = jsonStreamUtils

export const stateJsonStreamer = {
    stream(flowExecutorContext: FlowExecutorContext): Generator<string> {
        return jsonObject([
            ['version', JSON.stringify(FLOW_RUN_LOG_MANIFEST_V2)],
            ['executionState', jsonObject([
                ['steps', streamSteps(flowExecutorContext.steps)],
                ['tags', JSON.stringify(Array.from(flowExecutorContext.tags))],
            ])],
        ])
    },
}

function streamSteps(steps: Readonly<Record<string, StepOutput>>): Generator<string> {
    return jsonObject(stepEntries(steps))
}

function* stepEntries(steps: Readonly<Record<string, StepOutput>>): Generator<[string, JsonFragment]> {
    for (const [name, step] of Object.entries(steps)) {
        if (step.type === FlowActionType.LOOP_ON_ITEMS && !isNil(step.output)) {
            yield [name, streamLoopStep({ step, output: step.output })]
        }
        else {
            yield [name, JSON.stringify(step)]
        }
    }
}

function streamLoopStep({ step, output }: StreamLoopStepParams): Generator<string> {
    return jsonObject([
        ...definedEntries({
            type: step.type,
            status: step.status,
            input: step.input,
            outputType: step.outputType,
            duration: step.duration,
            errorMessage: step.errorMessage,
        }),
        ['output', jsonObject([
            ...definedEntries({ item: output.item, index: output.index }),
            ['iterations', jsonArray(output.iterations.map((iteration) => streamSteps(iteration)))],
        ])],
    ])
}

type StreamLoopStepParams = {
    step: StepOutput
    output: LoopStepResult
}
