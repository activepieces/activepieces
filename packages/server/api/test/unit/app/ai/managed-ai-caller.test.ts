import { ActivepiecesError, tryCatch } from '@activepieces/core-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { managedAiCaller } from '../../../../src/app/ai/managed-ai-caller'

const { mockGetFlow, mockGetFlowVersion } = vi.hoisted(() => ({
    mockGetFlow: vi.fn(),
    mockGetFlowVersion: vi.fn(),
}))

vi.mock('../../../../src/app/flows/flow/flow.service', () => ({
    flowService: () => ({ getOne: mockGetFlow }),
}))

vi.mock('../../../../src/app/flows/flow-version/flow-version.service', () => ({
    flowVersionService: () => ({ getOne: mockGetFlowVersion }),
}))

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }

function publishedFlowWith({ pieceName, pieceVersion }: { pieceName: string, pieceVersion: string }) {
    return {
        flowId: 'flow-1',
        trigger: {
            type: 'PIECE_TRIGGER',
            name: 'trigger',
            nextAction: {
                type: 'PIECE',
                name: 'step_1',
                settings: { pieceName, pieceVersion },
            },
        },
    }
}

async function refusalMessageOf(promise: Promise<void>): Promise<string> {
    const { error } = await tryCatch(() => promise)
    if (!(error instanceof ActivepiecesError) || !('message' in error.error.params)) {
        throw new Error('expected a refusal carrying a message')
    }
    return String(error.error.params.message)
}

function assert(overrides: Record<string, unknown> = {}) {
    return managedAiCaller.assertReportsCost({
        projectId: 'project-1',
        flowVersionId: 'fv-1',
        stepName: 'step_1',
        log: log as never,
        ...overrides,
    })
}

describe('managedAiCaller.assertReportsCost', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetFlow.mockResolvedValue({ id: 'flow-1', projectId: 'project-1' })
        mockGetFlowVersion.mockResolvedValue(publishedFlowWith({ pieceName: '@activepieces/piece-ai', pieceVersion: '0.11.0' }))
    })

    it('allows a step the published flow really says is the AI piece', async () => {
        await expect(assert()).resolves.toBeUndefined()
    })

    it('ignores the version the caller claims and reads the published one', async () => {
        mockGetFlowVersion.mockResolvedValue(publishedFlowWith({ pieceName: '@activepieces/piece-ai', pieceVersion: '0.4.5' }))

        expect(await refusalMessageOf(assert({ pieceVersion: '0.11.0' }))).toMatch(/0\.11\.0 or newer/)
    })

    it('refuses a step the published flow says is a different piece, whatever it claims', async () => {
        mockGetFlowVersion.mockResolvedValue(publishedFlowWith({ pieceName: '@activepieces/piece-http', pieceVersion: '0.11.0' }))

        expect(await refusalMessageOf(assert({ pieceVersion: '0.11.0' }))).toMatch(/Only @activepieces\/piece-ai/)
        expect(log.warn).toHaveBeenCalled()
    })

    it('falls back to the reported version when the caller names no flow version at all', async () => {
        await expect(assert({ flowVersionId: undefined, pieceVersion: '0.11.0' })).resolves.toBeUndefined()
        expect(await refusalMessageOf(assert({ flowVersionId: undefined, pieceVersion: '0.10.1' }))).toMatch(/0\.11\.0 or newer/)
    })

    it('refuses a caller naming a flow version that belongs to another project', async () => {
        mockGetFlow.mockResolvedValue(null)

        expect(await refusalMessageOf(assert({ pieceVersion: '0.11.0' }))).toMatch(/does not belong to this project/)
        expect(log.warn).toHaveBeenCalled()
    })

    it('falls back when the caller names a step that is not in the published flow', async () => {
        mockGetFlowVersion.mockResolvedValue(publishedFlowWith({ pieceName: '@activepieces/piece-ai', pieceVersion: '0.4.5' }))

        await expect(assert({ stepName: 'no_such_step', pieceVersion: '0.11.0' })).resolves.toBeUndefined()
    })

    it('refuses a caller that names no step and reports no version', async () => {
        expect(await refusalMessageOf(assert({ flowVersionId: undefined, stepName: undefined }))).toMatch(/0\.11\.0 or newer/)
    })

    it('scopes the ownership check to the caller own project', async () => {
        await assert()

        expect(mockGetFlow).toHaveBeenCalledWith({ id: 'flow-1', projectId: 'project-1' })
    })
})
