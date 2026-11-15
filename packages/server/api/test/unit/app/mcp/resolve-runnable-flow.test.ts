import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetOnePopulatedOrThrow } = vi.hoisted(() => ({
    mockGetOnePopulatedOrThrow: vi.fn(),
}))

vi.mock('../../../../src/app/flows/flow/flow.service', () => ({
    flowService: () => ({ getOnePopulatedOrThrow: mockGetOnePopulatedOrThrow }),
}))

const { resolveRunnableFlow } = await import('../../../../src/app/mcp/mcp-server-builder')

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() } as never

const flow = ({ versionId, publishedVersionId }: { versionId: string, publishedVersionId?: string }) => ({
    id: 'flow-1',
    ...(publishedVersionId === undefined ? {} : { publishedVersionId }),
    version: { id: versionId, displayName: 'My Flow' },
}) as never

describe('resolveRunnableFlow', () => {
    beforeEach(() => {
        mockGetOnePopulatedOrThrow.mockClear()
    })

    it('loads the published version when the draft has moved on, so the schema matches what runs', async () => {
        mockGetOnePopulatedOrThrow.mockResolvedValue(flow({ versionId: 'v-published' }))

        const runnable = await resolveRunnableFlow({ flow: flow({ versionId: 'v-draft', publishedVersionId: 'v-published' }), projectId: 'proj-1', log })

        expect(mockGetOnePopulatedOrThrow).toHaveBeenCalledWith({ id: 'flow-1', projectId: 'proj-1', versionId: 'v-published' })
        expect(runnable.version.id).toBe('v-published')
    })

    it('reads nothing extra when the draft is already the published version', async () => {
        const alreadyPublished = flow({ versionId: 'v-1', publishedVersionId: 'v-1' })

        expect(await resolveRunnableFlow({ flow: alreadyPublished, projectId: 'proj-1', log })).toBe(alreadyPublished)
        expect(mockGetOnePopulatedOrThrow).not.toHaveBeenCalled()
    })

    it('keeps the draft when nothing has been published yet', async () => {
        const draftOnly = flow({ versionId: 'v-draft' })

        expect(await resolveRunnableFlow({ flow: draftOnly, projectId: 'proj-1', log })).toBe(draftOnly)
        expect(mockGetOnePopulatedOrThrow).not.toHaveBeenCalled()
    })

    it('stays scoped to the project it was asked about', async () => {
        mockGetOnePopulatedOrThrow.mockResolvedValue(flow({ versionId: 'v-published' }))

        await resolveRunnableFlow({ flow: flow({ versionId: 'v-draft', publishedVersionId: 'v-published' }), projectId: 'proj-own', log })

        expect(mockGetOnePopulatedOrThrow).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'proj-own' }))
    })
})
