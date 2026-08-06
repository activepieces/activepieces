import { apId } from '@activepieces/core-utils'
import { PackageType, PieceSelectionMode, PieceType, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function setupExcludedPiece(pieceName: string) {
    const { mockPlatform, mockProject } = await mockAndSaveBasicSetup({
        plan: { managePiecesEnabled: true },
    })

    const pieceSetId = apId()
    await db.save('piece_set', {
        id: pieceSetId,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        platformId: mockPlatform.id,
        name: 'Migrated Allow List',
        isDefault: false,
        generatedForProjectId: mockProject.id,
        config: {
            pieces: { mode: PieceSelectionMode.EXCLUDE_ALL, exceptions: [] },
            selectedActions: {},
            selectedTriggers: {},
        },
    })
    await db.update('project', mockProject.id, { pieceSetId })

    await db.save('piece_metadata', createMockPieceMetadata({
        name: pieceName,
        version: '0.4.0',
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        platformId: undefined,
    }))

    const principal: Principal = {
        id: apId(),
        type: PrincipalType.ENGINE,
        projectId: mockProject.id,
        platform: { id: mockPlatform.id },
    }
    return generateMockToken(principal)
}

describe('Piece Bundle Endpoint (EE piece sets)', () => {
    it('serves a piece excluded from the project piece set', async () => {
        const pieceName = '@activepieces/piece-ai'
        const token = await setupExcludedPiece(pieceName)

        const response = await app!.inject({
            method: 'GET',
            url: `/api/v1/engine/pieces/bundle?name=${encodeURIComponent(pieceName)}&version=0.4.0`,
            headers: { authorization: `Bearer ${token}` },
        })

        expect(response.statusCode).toBe(StatusCodes.TEMPORARY_REDIRECT)
        expect(response.headers.location).toContain('registry.npmjs.org')
        expect(response.headers.location).toContain('piece-ai-0.4.0.tgz')
    })
})
