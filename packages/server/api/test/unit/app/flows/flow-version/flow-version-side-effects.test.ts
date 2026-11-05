import {
    BranchExecutionType,
    ContinueOnFailureBranches,
    FileType,
    FlowAction,
    FlowActionType,
    FlowOperationType,
    FlowTriggerType,
    FlowVersion,
    isNil,
    RouterExecutionType,
    SampleDataSettings,
} from '@activepieces/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flowVersionSideEffects } from '../../../../../src/app/flows/flow-version/flow-version-side-effects'
import { system } from '../../../../../src/app/helper/system/system'
import { createMockFlowVersion } from '../../../../helpers/mocks'

const { mockDeleteForStep } = vi.hoisted(() => ({
    mockDeleteForStep: vi.fn<(params: { fileId: string, fileType: FileType }) => Promise<void>>(),
}))

vi.mock('../../../../../src/app/flows/step-run/sample-data.service', () => ({
    sampleDataService: vi.fn(() => ({
        deleteForStep: mockDeleteForStep,
    })),
}))

vi.mock('../../../../../src/app/flows/flow/flow.service', () => ({
    flowService: vi.fn(() => ({
        updateLastModified: vi.fn(),
    })),
}))

vi.mock('../../../../../src/app/trigger/trigger-source/trigger-source-service', () => ({
    triggerSourceService: vi.fn(() => ({
        disable: vi.fn(),
    })),
}))

vi.mock('../../../../../src/app/helper/exception-handler', () => ({
    exceptionHandler: {
        handle: (e: unknown): never => {
            throw e
        },
    },
}))

const log = system.globalLogger()

describe('flowVersionSideEffects DELETE_ACTION sample data cleanup', () => {
    beforeEach(() => {
        mockDeleteForStep.mockReset()
    })

    it('deletes the sample data of a deleted loop and of the steps nested in it', async () => {
        const flowVersion = flowVersionWith(loopStep({
            name: 'step_1',
            firstLoopAction: codeStep({ name: 'step_2', nextAction: codeStep({ name: 'step_3' }) }),
            nextAction: codeStep({ name: 'step_4' }),
        }))

        const deletedFiles = await deleteSteps({ flowVersion, names: ['step_1'] })

        expect(deletedFiles).toEqual(sampleDataFilesOf(['step_1', 'step_2', 'step_3']))
        expect(mockDeleteForStep).toHaveBeenCalledWith(expect.objectContaining({
            projectId: 'project-1',
            flowId: 'flow-1',
            flowVersionId: 'version-1',
        }))
    })

    it('deletes the sample data of every step under a deleted router', async () => {
        const flowVersion = flowVersionWith(routerStep({
            name: 'step_1',
            children: [codeStep({ name: 'step_2', nextAction: codeStep({ name: 'step_3' }) }), null],
        }))

        const deletedFiles = await deleteSteps({ flowVersion, names: ['step_1'] })

        expect(deletedFiles).toEqual(sampleDataFilesOf(['step_1', 'step_2', 'step_3']))
    })

    it('deletes the sample data of the steps in the success and failure branches of a deleted step', async () => {
        const flowVersion = flowVersionWith(codeStep({
            name: 'step_1',
            continueOnFailureBranches: {
                onSuccess: codeStep({ name: 'step_2' }),
                onFailure: codeStep({ name: 'step_3' }),
            },
        }))

        const deletedFiles = await deleteSteps({ flowVersion, names: ['step_1'] })

        expect(deletedFiles).toEqual(sampleDataFilesOf(['step_1', 'step_2', 'step_3']))
    })

    it('keeps the sample data of the loop and of the next step when a step inside the loop is deleted', async () => {
        const flowVersion = flowVersionWith(loopStep({
            name: 'step_1',
            firstLoopAction: codeStep({ name: 'step_2', nextAction: codeStep({ name: 'step_3' }) }),
        }))

        const deletedFiles = await deleteSteps({ flowVersion, names: ['step_2'] })

        expect(deletedFiles).toEqual(sampleDataFilesOf(['step_2']))
    })

    it('deletes each file once when a loop and its nested step are both selected', async () => {
        const flowVersion = flowVersionWith(loopStep({
            name: 'step_1',
            firstLoopAction: codeStep({ name: 'step_2' }),
        }))

        const deletedFiles = await deleteSteps({ flowVersion, names: ['step_1', 'step_2'] })

        expect(deletedFiles).toEqual(sampleDataFilesOf(['step_1', 'step_2']))
    })

    it('still deletes the sample data of the existing steps when a requested name is not in the flow', async () => {
        const flowVersion = flowVersionWith(loopStep({
            name: 'step_1',
            firstLoopAction: codeStep({ name: 'step_2' }),
        }))

        const deletedFiles = await deleteSteps({ flowVersion, names: ['step_9', 'step_1'] })

        expect(deletedFiles).toEqual(sampleDataFilesOf(['step_1', 'step_2']))
    })
})

function codeStep({ name, nextAction, continueOnFailureBranches }: { name: string, nextAction?: FlowAction, continueOnFailureBranches?: ContinueOnFailureBranches }): FlowAction {
    return {
        name,
        displayName: name,
        type: FlowActionType.CODE,
        valid: true,
        lastUpdatedDate: '2024-01-01T00:00:00Z',
        settings: {
            sourceCode: { code: 'export const code = async () => 1', packageJson: '{}' },
            input: {},
            errorHandlingOptions: { continueOnFailure: { value: !isNil(continueOnFailureBranches) } },
            sampleData: sampleDataOf(name),
        },
        nextAction,
        continueOnFailureBranches,
    }
}

function loopStep({ name, firstLoopAction, nextAction }: { name: string, firstLoopAction: FlowAction, nextAction?: FlowAction }): FlowAction {
    return {
        name,
        displayName: name,
        type: FlowActionType.LOOP_ON_ITEMS,
        valid: true,
        lastUpdatedDate: '2024-01-01T00:00:00Z',
        settings: {
            items: '{{trigger.body.items}}',
            sampleData: sampleDataOf(name),
        },
        firstLoopAction,
        nextAction,
    }
}

function routerStep({ name, children }: { name: string, children: (FlowAction | null)[] }): FlowAction {
    return {
        name,
        displayName: name,
        type: FlowActionType.ROUTER,
        valid: true,
        lastUpdatedDate: '2024-01-01T00:00:00Z',
        settings: {
            executionType: RouterExecutionType.EXECUTE_FIRST_MATCH,
            branches: [
                { branchType: BranchExecutionType.CONDITION, branchName: 'Branch 1', conditions: [] },
                { branchType: BranchExecutionType.FALLBACK, branchName: 'Otherwise' },
            ],
            sampleData: sampleDataOf(name),
        },
        children,
    }
}

function sampleDataOf(name: string): SampleDataSettings {
    return {
        sampleDataFileId: `${name}-output`,
        sampleDataInputFileId: `${name}-input`,
    }
}

function sampleDataFilesOf(stepNames: string[]): string[] {
    return stepNames.flatMap((name) => [`${FileType.SAMPLE_DATA}:${name}-output`, `${FileType.SAMPLE_DATA_INPUT}:${name}-input`]).sort()
}

function flowVersionWith(firstAction: FlowAction): FlowVersion {
    return createMockFlowVersion({
        id: 'version-1',
        flowId: 'flow-1',
        trigger: {
            name: 'trigger',
            displayName: 'Webhook',
            type: FlowTriggerType.PIECE,
            valid: true,
            lastUpdatedDate: '2024-01-01T00:00:00Z',
            settings: {
                pieceName: '@activepieces/piece-webhook',
                pieceVersion: '0.1.0',
                triggerName: 'catch_webhook',
                input: {},
                propertySettings: {},
                sampleData: sampleDataOf('trigger'),
            },
            nextAction: firstAction,
        },
    })
}

async function deleteSteps({ flowVersion, names }: { flowVersion: FlowVersion, names: string[] }): Promise<string[]> {
    await flowVersionSideEffects(log).preApplyOperation({
        projectId: 'project-1',
        flowVersion,
        operation: { type: FlowOperationType.DELETE_ACTION, request: { names } },
    })
    return mockDeleteForStep.mock.calls.map(([params]) => `${params.fileType}:${params.fileId}`).sort()
}
