import {
    AI_PIECE_NAME,
    AIProviderName,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../src/app/pieces/metadata/piece-metadata-service', () => ({
    pieceMetadataService: vi.fn(),
}))

const { findCompatiblePieceVersion } = await import('../../../src/app/flows/flow-version/ai-piece-version-resolver')
const { pieceMetadataService } = await import('../../../src/app/pieces/metadata/piece-metadata-service')

const log = { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() } as unknown as FastifyBaseLogger

function stubInstalledVersion(version: string | null): void {
    vi.mocked(pieceMetadataService).mockReturnValue({
        get: vi.fn().mockResolvedValue(version ? { name: AI_PIECE_NAME, version } : undefined),
    // @ts-expect-error — partial stub is sufficient for the resolver's needs
    })
}

describe('findCompatiblePieceVersion', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns the installed version when it supports the target provider', async () => {
        stubInstalledVersion('0.3.7')
        const result = await findCompatiblePieceVersion({
            platformId: 'platform-1',
            projectId: 'project-1',
            targetProvider: AIProviderName.BEDROCK,
            targetModel: 'anthropic.claude-3-sonnet',
            log,
        })
        expect(result.pieceVersion).toBe('0.3.7')
        expect(result.effectiveTargetProvider).toBe(AIProviderName.BEDROCK)
        expect(result.minRequiredPieceVersion).toBe('0.3.6')
    })

    it('returns null pieceVersion when installed version is below the introducedAt version', async () => {
        stubInstalledVersion('0.3.5')
        const result = await findCompatiblePieceVersion({
            platformId: 'platform-1',
            projectId: 'project-1',
            targetProvider: AIProviderName.BEDROCK,
            targetModel: 'anthropic.claude-3-sonnet',
            log,
        })
        expect(result.pieceVersion).toBeNull()
        expect(result.minRequiredPieceVersion).toBe('0.3.6')
    })

    it('returns null pieceVersion when piece is not installed at all', async () => {
        stubInstalledVersion(null)
        const result = await findCompatiblePieceVersion({
            platformId: 'platform-1',
            projectId: 'project-1',
            targetProvider: AIProviderName.OPENAI,
            targetModel: 'gpt-4',
            log,
        })
        expect(result.pieceVersion).toBeNull()
        expect(result.minRequiredPieceVersion).toBe('0.0.1')
    })

    it('resolves CF-gateway/openai submodel to effective OPENAI for capability check', async () => {
        stubInstalledVersion('0.3.7')
        const result = await findCompatiblePieceVersion({
            platformId: 'platform-1',
            projectId: 'project-1',
            targetProvider: AIProviderName.CLOUDFLARE_GATEWAY,
            targetModel: 'openai/gpt-4o',
            log,
        })
        expect(result.effectiveTargetProvider).toBe(AIProviderName.OPENAI)
        expect(result.pieceVersion).toBe('0.3.7')
    })

    it('falls back to CLOUDFLARE_GATEWAY when submodel prefix is unrecognized', async () => {
        stubInstalledVersion('0.3.7')
        const result = await findCompatiblePieceVersion({
            platformId: 'platform-1',
            projectId: 'project-1',
            targetProvider: AIProviderName.CLOUDFLARE_GATEWAY,
            targetModel: 'someproxy/gpt-custom',
            log,
        })
        expect(result.effectiveTargetProvider).toBe(AIProviderName.CLOUDFLARE_GATEWAY)
        expect(result.pieceVersion).toBe('0.3.7')
    })
})
