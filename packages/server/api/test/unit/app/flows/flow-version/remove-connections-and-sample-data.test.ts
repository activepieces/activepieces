import { CodeAction, FlowAction, FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { describe, expect, it, vi } from 'vitest'
import { flowVersionService } from '../../../../../src/app/flows/flow-version/flow-version.service'

const mockLog = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
} as unknown as FastifyBaseLogger

function buildCodeAction(name: string, nextAction?: FlowAction): CodeAction {
    return {
        name,
        type: FlowActionType.CODE,
        valid: true,
        displayName: name,
        lastUpdatedDate: '2026-05-02T00:00:00.000Z',
        settings: {
            sourceCode: { code: '', packageJson: '{}' },
            input: {
                url: 'https://example.com',
                token: '{{connections.my_connection}}',
            },
            sampleData: {
                sampleDataFileId: 'file-1',
                sampleDataInputFileId: 'file-2',
                lastTestDate: '2026-05-02T00:00:00.000Z',
            },
            errorHandlingOptions: {
                continueOnFailure: { value: false },
                retryOnFailure: { value: false },
            },
        },
        nextAction,
    }
}

function buildChainedFlowVersion(stepCount: number): FlowVersion {
    let nextAction: FlowAction | undefined = undefined
    for (let i = stepCount; i >= 1; i--) {
        nextAction = buildCodeAction(`step_${i}`, nextAction)
    }
    const trigger: FlowTrigger = {
        name: 'trigger',
        type: FlowTriggerType.EMPTY,
        valid: false,
        displayName: 'Select Trigger',
        lastUpdatedDate: '2026-05-02T00:00:00.000Z',
        settings: {},
        nextAction,
    }
    return {
        id: 'flow-version-id',
        created: '2026-05-02T00:00:00.000Z',
        updated: '2026-05-02T00:00:00.000Z',
        flowId: 'flow-id',
        displayName: 'quadratic clone regression',
        trigger,
        valid: false,
        state: FlowVersionState.DRAFT,
        schemaVersion: '1',
        connectionIds: [],
        agentIds: [],
    }
}

function removeAll(flowVersion: FlowVersion): FlowVersion {
    return flowVersionService(mockLog).removeConnectionsAndSampleDataFromFlowVersion(flowVersion, true, true)
}

describe('removeConnectionsAndSampleDataFromFlowVersion', () => {
    it('strips connection references and sample data from every step in the chain', () => {
        const result = removeAll(buildChainedFlowVersion(25))

        const codeSteps = flowStructureUtil.getAllSteps(result.trigger).filter((step) => step.type === FlowActionType.CODE)
        expect(codeSteps).toHaveLength(25)
        for (const step of codeSteps) {
            expect(step.settings.input.token).toBeUndefined()
            expect(step.settings.input.url).toBe('https://example.com')
            expect(step.settings.sampleData?.sampleDataFileId).toBeUndefined()
            expect(step.settings.sampleData?.sampleDataInputFileId).toBeUndefined()
            expect(step.settings.sampleData?.lastTestDate).toBeUndefined()
        }
    })

    it('leaves the input flow version untouched', () => {
        const flowVersion = buildChainedFlowVersion(5)
        const before = JSON.stringify(flowVersion)

        removeAll(flowVersion)

        expect(JSON.stringify(flowVersion)).toBe(before)
    })

    it('clones the flow a constant number of times regardless of step count', () => {
        const measure = (stepCount: number): number => {
            const flowVersion = buildChainedFlowVersion(stepCount)
            const spy = vi.spyOn(JSON, 'stringify')
            removeAll(flowVersion)
            const calls = spy.mock.calls.length
            spy.mockRestore()
            return calls
        }

        expect(measure(200)).toBe(measure(20))
    })
})
