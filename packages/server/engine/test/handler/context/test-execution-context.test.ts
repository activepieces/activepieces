import { tryParseFriendlyPieceError } from '@activepieces/core-utils'
import { LATEST_CONTEXT_VERSION } from '@activepieces/pieces-framework'
import { CodeAction, FlowAction, FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState, StepOutputStatus } from '@activepieces/shared'
import { FlowExecutorContext } from '../../../src/lib/handler/context/flow-execution-context'
import { testExecutionContext } from '../../../src/lib/handler/context/test-execution-context'
import { createPropsResolver } from '../../../src/lib/variables/props-resolver'
import { generateMockEngineConstants } from '../test-helper'

describe('testExecutionContext.stateFromFlowVersion', () => {
    it('seeds the parent as failed when the tested step is in its failure branch', async () => {
        const flowVersion = buildFlowVersion({
            firstAction: buildCodeStep({
                name: 'parent',
                continueOnFailure: true,
                onFailure: buildCodeStep({ name: 'failure_child' }),
            }),
        })

        const state = await buildState({ flowVersion, excludedStepName: 'failure_child', sampleData: { parent: { id: 7 } } })
        const resolved = await resolveInput({
            state,
            input: { message: '{{parent[\'error\'][\'message\']}}', id: '{{parent[\'output\'][\'id\']}}' },
        })

        expect(state.getStepOutput('parent')?.status).toBe(StepOutputStatus.FAILED)
        expect(tryParseFriendlyPieceError(resolved.message)?.message).toBe('---runtime error message---')
        expect(resolved.id).toBe(7)
    })

    it('keeps the parent succeeded when the tested step is in its success branch', async () => {
        const flowVersion = buildFlowVersion({
            firstAction: buildCodeStep({
                name: 'parent',
                continueOnFailure: true,
                onSuccess: buildCodeStep({ name: 'success_child' }),
                onFailure: buildCodeStep({ name: 'failure_child' }),
            }),
        })

        const state = await buildState({ flowVersion, excludedStepName: 'success_child' })
        const resolved = await resolveInput({ state, input: { message: '{{parent[\'error\'][\'message\']}}' } })

        expect(state.getStepOutput('parent')?.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(resolved.message).toBe('')
    })

    it('fails only the ancestor whose failure branch holds the tested step', async () => {
        const flowVersion = buildFlowVersion({
            firstAction: buildCodeStep({
                name: 'outer',
                continueOnFailure: true,
                onSuccess: buildCodeStep({
                    name: 'inner',
                    continueOnFailure: true,
                    onFailure: buildCodeStep({ name: 'nested_child' }),
                }),
            }),
        })

        const state = await buildState({ flowVersion, excludedStepName: 'nested_child' })

        expect(state.getStepOutput('inner')?.status).toBe(StepOutputStatus.FAILED)
        expect(state.getStepOutput('outer')?.status).toBe(StepOutputStatus.SUCCEEDED)
    })

    it('keeps the parent succeeded when the tested step is a plain sibling after it', async () => {
        const flowVersion = buildFlowVersion({
            firstAction: buildCodeStep({
                name: 'parent',
                continueOnFailure: true,
                nextAction: buildCodeStep({ name: 'sibling' }),
            }),
        })

        const state = await buildState({ flowVersion, excludedStepName: 'sibling' })

        expect(state.getStepOutput('parent')?.status).toBe(StepOutputStatus.SUCCEEDED)
    })

    it('keeps every step succeeded when no step is under test', async () => {
        const flowVersion = buildFlowVersion({
            firstAction: buildCodeStep({
                name: 'parent',
                continueOnFailure: true,
                onFailure: buildCodeStep({ name: 'failure_child' }),
            }),
        })

        const state = await buildState({ flowVersion })

        expect(state.getStepOutput('parent')?.status).toBe(StepOutputStatus.SUCCEEDED)
        expect(state.getStepOutput('failure_child')?.status).toBe(StepOutputStatus.SUCCEEDED)
    })
})

function buildState({ flowVersion, excludedStepName, sampleData }: {
    flowVersion: FlowVersion
    excludedStepName?: string
    sampleData?: Record<string, unknown>
}): Promise<FlowExecutorContext> {
    return testExecutionContext.stateFromFlowVersion({
        flowVersion,
        excludedStepName,
        sampleData,
        projectId: 'projectId',
        apiUrl: 'http://127.0.0.1:3000/',
        engineToken: 'engineToken',
        engineConstants: generateMockEngineConstants(),
    })
}

async function resolveInput<T>({ state, input }: { state: FlowExecutorContext, input: T }): Promise<T> {
    const { resolvedInput } = await createPropsResolver({
        projectId: 'projectId',
        engineToken: 'engineToken',
        apiUrl: 'http://127.0.0.1:3000/',
        contextVersion: LATEST_CONTEXT_VERSION,
        stepNames: STEP_NAMES,
    }).resolve<T>({ unresolvedInput: input, executionState: state })
    return resolvedInput
}

function buildCodeStep({ name, continueOnFailure, onSuccess, onFailure, nextAction }: {
    name: string
    continueOnFailure?: boolean
    onSuccess?: FlowAction
    onFailure?: FlowAction
    nextAction?: FlowAction
}): CodeAction {
    return {
        name,
        displayName: name,
        type: FlowActionType.CODE,
        skip: false,
        valid: true,
        lastUpdatedDate: LAST_UPDATED_DATE,
        settings: {
            input: {},
            sourceCode: { packageJson: '', code: '' },
            errorHandlingOptions: { continueOnFailure: { value: continueOnFailure ?? false } },
        },
        continueOnFailureBranches: { onSuccess, onFailure },
        nextAction,
    }
}

function buildFlowVersion({ firstAction }: { firstAction: FlowAction }): FlowVersion {
    return {
        id: 'flowVersionId',
        created: LAST_UPDATED_DATE,
        updated: LAST_UPDATED_DATE,
        flowId: 'flowId',
        displayName: 'Test Flow',
        trigger: {
            name: 'trigger',
            valid: true,
            displayName: 'Trigger',
            type: FlowTriggerType.EMPTY,
            settings: {},
            lastUpdatedDate: LAST_UPDATED_DATE,
            nextAction: firstAction,
        },
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

const STEP_NAMES = ['trigger', 'parent', 'failure_child', 'success_child', 'outer', 'inner', 'nested_child', 'sibling']
const LAST_UPDATED_DATE = '2026-01-01T00:00:00Z'
