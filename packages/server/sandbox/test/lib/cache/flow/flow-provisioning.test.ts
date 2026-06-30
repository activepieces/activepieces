import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { type ApLogger } from '@activepieces/server-utils'
import { FlowActionType, FlowTriggerType, FlowVersion, FlowVersionState, LATEST_FLOW_SCHEMA_VERSION, PackageType, PieceType, WorkerToApiContract } from '@activepieces/shared'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { flowProvisioning } from '../../../../src/lib/cache/flow/flow-provisioning'

const folders: string[] = []

function uniqueBasePath(): string {
    const folder = join(tmpdir(), `flow-provisioning-test-${randomUUID()}`)
    folders.push(folder)
    return folder
}

const fakeLog = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn(), child: vi.fn().mockReturnThis() } as unknown as ApLogger

const getSettings = () => ({
    EXECUTION_MODE: 'UNSANDBOXED',
    DEV_PIECES: [] as string[],
    ENVIRONMENT: 'production',
    REUSE_SANDBOX: undefined,
    FLOW_TIMEOUT_SECONDS: 600,
    MAX_FILE_SIZE_MB: 10,
    MAX_FLOW_RUN_LOG_SIZE_MB: 10,
    NETWORK_MODE: 'UNRESTRICTED' as never,
    SANDBOX_MEMORY_LIMIT: '1048576',
    SANDBOX_PROPAGATED_ENV_VARS: [] as string[],
    SSRF_ALLOW_LIST: [] as string[],
})

function flowWithPiece(overrides: Partial<FlowVersion> = {}): FlowVersion {
    return {
        id: 'fv1', created: '2026-01-01T00:00:00.000Z', updated: '2026-01-01T00:00:00.000Z',
        flowId: 'flow1', displayName: 'Test', updatedBy: null, valid: true,
        schemaVersion: LATEST_FLOW_SCHEMA_VERSION, agentIds: [], state: FlowVersionState.LOCKED,
        connectionIds: [], backupFiles: null, notes: [],
        trigger: {
            name: 'trigger', type: FlowTriggerType.EMPTY, displayName: 'Trigger', valid: true, settings: {},
            nextAction: {
                name: 'step_1', type: FlowActionType.PIECE, displayName: 'HTTP', valid: true,
                settings: { pieceName: '@activepieces/piece-http', pieceVersion: '^1.0.0', actionName: 'send', input: {}, inputUiInfo: {} },
            },
        },
        ...overrides,
    } as unknown as FlowVersion
}

const httpPiece = { packageType: PackageType.REGISTRY, name: '@activepieces/piece-http', version: '1.0.5', pieceType: PieceType.OFFICIAL }

// An AI "Run Agent" step (a PIECE step) whose tools reference pieces that are NOT their own flow steps.
// The perplexity tool carries the legacy flat `predefinedInput` ({ auth, model }), the shape stored by older
// flows before the `{ fields }` structure existed — it must still be provisioned.
function flowWithAgentTools(): FlowVersion {
    return flowWithPiece({
        trigger: {
            name: 'trigger', type: FlowTriggerType.EMPTY, displayName: 'Trigger', valid: true, settings: {},
            nextAction: {
                name: 'step_1', type: FlowActionType.PIECE, displayName: 'Run Agent', valid: true,
                settings: {
                    pieceName: '@activepieces/piece-ai', pieceVersion: '0.1.0', actionName: 'run_agent', inputUiInfo: {},
                    input: {
                        agentTools: [
                            {
                                type: 'PIECE', toolName: 'perplexity-ai-ask-ai_1uulmb_mcp',
                                pieceMetadata: {
                                    pieceName: '@activepieces/piece-perplexity-ai', actionName: 'ask-ai', pieceVersion: '0.2.8',
                                    predefinedInput: { auth: "{{connections['c1']}}", model: 'sonar-reasoning-pro' },
                                },
                            },
                            { type: 'FLOW', toolName: 'some-flow-tool' },
                        ],
                    },
                },
            },
        },
    } as unknown as Partial<FlowVersion>)
}

const flow = { id: 'flow1', versionId: 'fv1', projectId: 'p1' }

afterEach(async () => {
    for (const f of folders) {
        await rm(f, { recursive: true, force: true })
    }
    folders.length = 0
    vi.clearAllMocks()
})

describe('flowProvisioning.resolve', () => {
    it('bundle hit → ready with no codeSteps and no publish (zero flow/piece resolution)', async () => {
        const manifest = { flowVersion: flowWithPiece(), pieces: [httpPiece], codes: [] }
        const getFlowVersion = vi.fn()
        const getPiece = vi.fn()
        const apiClient = {
            async getFlowBundle() { return { kind: 'inline', data: Buffer.from(JSON.stringify(manifest), 'utf8') } },
            getFlowVersion, getPiece,
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })

        expect(resolved.kind).toBe('ready')
        if (resolved.kind === 'ready') {
            expect(resolved.code).toEqual({ kind: 'materialized' })
            expect(resolved.publishBundle).toBeNull()
            expect(resolved.pieces).toEqual([httpPiece])
        }
        expect(getFlowVersion).not.toHaveBeenCalled()
        expect(getPiece).not.toHaveBeenCalled()
    })

    it('bundle fetch error → falls back to resolve (never fails the run)', async () => {
        const getFlowVersion = vi.fn(async () => flowWithPiece())
        const apiClient = {
            async getFlowBundle() { throw new Error('rpc/s3 down') },
            getFlowVersion,
            async getPiece() { return httpPiece },
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })

        expect(resolved.kind).toBe('ready')
        expect(getFlowVersion).toHaveBeenCalled()
    })

    it('miss + flow not found → flow-not-found', async () => {
        const apiClient = {
            async getFlowBundle() { return null },
            async getFlowVersion() { return null },
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })
        expect(resolved.kind).toBe('flow-not-found')
    })

    it('miss + LOCKED flow with resolvable piece → ready, pieces resolved, needsPublish=true', async () => {
        const apiClient = {
            async getFlowBundle() { return null },
            async getFlowVersion() { return flowWithPiece() },
            async getPiece() { return httpPiece },
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })

        expect(resolved.kind).toBe('ready')
        if (resolved.kind === 'ready') {
            expect(resolved.publishBundle).not.toBeNull()
            expect(resolved.code.kind).toBe('source')
            expect(resolved.pieces).toHaveLength(1)
            expect(resolved.pieces[0].pieceVersion).toBe('1.0.5')
        }
    })

    it('miss + DRAFT flow → ready but no publish handle', async () => {
        const apiClient = {
            async getFlowBundle() { return null },
            async getFlowVersion() { return flowWithPiece({ state: FlowVersionState.DRAFT }) },
            async getPiece() { return httpPiece },
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })
        expect(resolved.kind === 'ready' && resolved.publishBundle === null).toBe(true)
    })

    it('miss + agent tool piece with legacy flat predefinedInput → tool piece is provisioned', async () => {
        const requested: { name: string, version: string }[] = []
        const apiClient = {
            async getFlowBundle() { return null },
            async getFlowVersion() { return flowWithAgentTools() },
            async getPiece({ name, version }: { name: string, version: string }) {
                requested.push({ name, version })
                return { packageType: PackageType.REGISTRY, name, version, pieceType: PieceType.OFFICIAL }
            },
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })

        expect(resolved.kind).toBe('ready')
        const resolvedNames = resolved.kind === 'ready' ? resolved.pieces.map((p) => p.pieceName) : []
        expect(resolvedNames).toContain('@activepieces/piece-ai')
        expect(resolvedNames).toContain('@activepieces/piece-perplexity-ai')
        expect(requested).toContainEqual({ name: '@activepieces/piece-perplexity-ai', version: '0.2.8' })
    })

    it('miss + missing piece → disabled and the flow is disabled via apiClient', async () => {
        const disableFlow = vi.fn(async () => undefined)
        const apiClient = {
            async getFlowBundle() { return null },
            async getFlowVersion() { return flowWithPiece() },
            async getPiece() { return null },
            disableFlow,
        } as unknown as WorkerToApiContract

        const resolved = await flowProvisioning(fakeLog, apiClient, uniqueBasePath(), getSettings).resolve({ flow, platformId: 'plat1' })

        expect(resolved.kind).toBe('disabled')
        expect(disableFlow).toHaveBeenCalledWith({ flowId: 'flow1', projectId: 'p1' })
    })
})
