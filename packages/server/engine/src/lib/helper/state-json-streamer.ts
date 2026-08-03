import { isNil } from '@activepieces/core-utils'
import { FLOW_RUN_LOG_MANIFEST_V2, FlowActionType, LoopStepResult, StepOutput } from '@activepieces/shared'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { runStateStore } from './run-state-store'

export const stateJsonStreamer = {
    stream(flowExecutorContext: FlowExecutorContext): Generator<string> {
        return jsonObject([
            ['version', JSON.stringify(FLOW_RUN_LOG_MANIFEST_V2)],
            ['executionState', jsonObject([
                ['steps', streamSteps(flowExecutorContext.steps, [])],
                ['tags', JSON.stringify(Array.from(flowExecutorContext.tags))],
            ])],
        ])
    },
}

function streamSteps(steps: Readonly<Record<string, StepOutput>>, pathPrefix: Array<[string, number]>): Generator<string> {
    return jsonObject(stepEntries(steps, pathPrefix))
}

function* stepEntries(steps: Readonly<Record<string, StepOutput>>, pathPrefix: Array<[string, number]>): Generator<[string, JsonFragment]> {
    for (const [name, step] of Object.entries(steps)) {
        if (step.type === FlowActionType.LOOP_ON_ITEMS && !isNil(step.output)) {
            yield [name, streamLoopStep({ step, output: step.output, name, pathPrefix })]
        }
        else {
            yield [name, runStateStore.getStepOutputJson({ name, stepPath: JSON.stringify(pathPrefix) }) ?? JSON.stringify(step)]
        }
    }
}

function streamLoopStep({ step, output, name, pathPrefix }: StreamLoopStepParams): Generator<string> {
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
            ['iterations', jsonArray(output.iterations.map((iteration, index) => streamSteps(iteration, [...pathPrefix, [name, index]])))],
        ])],
    ])
}

function definedEntries(record: Record<string, unknown>): Array<[string, string]> {
    return Object.entries(record)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]): [string, string] => [key, JSON.stringify(value)])
}

function* jsonObject(entries: Iterable<[string, JsonFragment]>): Generator<string> {
    yield '{'
    let first = true
    for (const [key, value] of entries) {
        yield `${first ? '' : ','}${JSON.stringify(key)}:`
        first = false
        yield* toGenerator(value)
    }
    yield '}'
}

function* jsonArray(items: Iterable<JsonFragment>): Generator<string> {
    yield '['
    let first = true
    for (const item of items) {
        if (!first) {
            yield ','
        }
        first = false
        yield* toGenerator(item)
    }
    yield ']'
}

function* toGenerator(fragment: JsonFragment): Generator<string> {
    if (typeof fragment === 'string') {
        yield fragment
        return
    }
    yield* fragment
}

type JsonFragment = string | Generator<string>

type StreamLoopStepParams = {
    step: StepOutput
    output: LoopStepResult
    name: string
    pathPrefix: Array<[string, number]>
}
