import { PropertyType } from '@activepieces/pieces-framework'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetOrThrow, mockExecuteAdhocAction, mockResolveProperty, mockCompleter } = vi.hoisted(() => ({
    mockGetOrThrow: vi.fn(),
    mockExecuteAdhocAction: vi.fn(),
    mockResolveProperty: vi.fn(),
    mockCompleter: vi.fn(),
}))

vi.mock('../../../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: () => ({ getOrThrow: mockGetOrThrow }),
    getPiecePackageWithoutArchive: vi.fn(),
}))

vi.mock('../../../../../src/app/mcp/tools/flow-run-utils', () => ({
    executeAdhocAction: mockExecuteAdhocAction,
}))

vi.mock('../../../../../src/app/mcp/tools/mcp-utils', () => ({
    mcpUtils: { executePropertyResolution: mockResolveProperty },
}))

vi.mock('../../../../../src/app/ee/agent/tools/piece-input-filler', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../../../src/app/ee/agent/tools/piece-input-filler')>()
    return { ...actual, pieceInputFiller: { ...actual.pieceInputFiller, modelCompleter: () => mockCompleter } }
})

const log = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }

function metadataWith(props: Record<string, unknown>) {
    return { version: '1.4.0', actions: { send_message: { props } } }
}

async function run(overrides: Record<string, unknown> = {}) {
    const { pieceToolRunner } = await import('../../../../../src/app/ee/agent/tools/piece-tool-runner')
    return pieceToolRunner.runFromInstruction({
        piece: { pieceName: '@activepieces/piece-slack', actionName: 'send_message' },
        instruction: 'say hello in general',
        model: {} as never,
        projectId: 'proj-1',
        platformId: 'plat-1',
        log: log as never,
        ...overrides,
    } as never)
}

describe('pieceToolRunner.runFromInstruction', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockGetOrThrow.mockResolvedValue(metadataWith({ text: { displayName: 'Text', required: true, type: PropertyType.SHORT_TEXT } }))
        mockCompleter.mockResolvedValue({ text: 'hello' })
        mockExecuteAdhocAction.mockResolvedValue({ content: [{ type: 'text', text: 'sent' }] })
    })

    it('executes the action with the input the model filled in', async () => {
        await run()

        expect(mockExecuteAdhocAction).toHaveBeenCalledWith(expect.objectContaining({
            pieceName: '@activepieces/piece-slack',
            actionName: 'send_message',
            input: { text: 'hello' },
        }))
    })

    it('does not pin a version on execution, because the adhoc path validates against the latest', async () => {
        await run()

        const call = mockExecuteAdhocAction.mock.calls[0]?.[0] ?? {}
        expect(call).not.toHaveProperty('pieceVersion')
    })

    it('reads the latest metadata, the same version the adhoc path will validate against', async () => {
        await run()

        expect(mockGetOrThrow).toHaveBeenCalledWith(expect.objectContaining({
            name: '@activepieces/piece-slack',
            version: undefined,
        }))
    })

    it('resolves properties against the version it actually read', async () => {
        mockGetOrThrow.mockResolvedValue(metadataWith({ channel: { displayName: 'Channel', required: true, type: PropertyType.DROPDOWN } }))
        mockResolveProperty.mockResolvedValue({ status: 'options', options: [{ label: 'general', value: 'C1' }] })
        mockCompleter.mockResolvedValue({ channel: 'C1' })

        await run()

        expect(mockResolveProperty).toHaveBeenCalledWith(expect.objectContaining({
            pieceVersion: '1.4.0',
            actionOrTriggerName: 'send_message',
            projectId: 'proj-1',
        }))
    })

    it('redacts the connection from the input it reports back', async () => {
        const { resolvedInput } = await run({
            predefinedInput: { auth: 'conn-1' },
            connectionExternalId: 'conn-1',
        })

        expect(resolvedInput.auth).toBe('Redacted')
        expect(resolvedInput.text).toBe('hello')
    })

    it('leaves the input alone when the action needs no connection', async () => {
        const { resolvedInput } = await run()

        expect(resolvedInput).not.toHaveProperty('auth')
    })

    it('fails clearly when the piece has no such action', async () => {
        mockGetOrThrow.mockResolvedValue({ version: '1.0.0', actions: {} })

        await expect(run()).rejects.toThrow()
        expect(mockExecuteAdhocAction).not.toHaveBeenCalled()
    })

    it('does not execute anything when input filling fails', async () => {
        mockCompleter.mockRejectedValue(new Error('model unavailable'))

        await expect(run()).rejects.toThrow(/model unavailable/)
        expect(mockExecuteAdhocAction).not.toHaveBeenCalled()
    })
})
