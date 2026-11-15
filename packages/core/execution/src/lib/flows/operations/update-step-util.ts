import { deepEquals, prune } from '@activepieces/core-utils'
import { FlowAction } from '../actions/action'
import { FlowTrigger } from '../triggers/trigger'

function contentOf(step: FlowAction | FlowTrigger): Record<string, unknown> {
    const settings: Record<string, unknown> = { ...(step.settings ?? {}) }
    const input = settings['input']
    delete settings['input']
    delete settings['sampleData']
    delete settings['customLogoUrl']
    return {
        type: step.type,
        input: input ?? {},
        optionSettings: prune(settings),
    }
}

function preserveLastUpdatedDate<T extends FlowAction | FlowTrigger>({ existingStep, updatedStep }: PreserveLastUpdatedDateParams<T>): T {
    const contentChanged = !deepEquals({ a: contentOf(existingStep), b: contentOf(updatedStep) })
    if (contentChanged) {
        return updatedStep
    }
    return {
        ...updatedStep,
        lastUpdatedDate: existingStep.lastUpdatedDate,
    }
}

export const updateStepUtil = {
    preserveLastUpdatedDate,
}

type PreserveLastUpdatedDateParams<T extends FlowAction | FlowTrigger> = {
    existingStep: FlowAction | FlowTrigger
    updatedStep: T
}
