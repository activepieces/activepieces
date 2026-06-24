import { apId } from '@activepieces/core-utils'
import { FileCompression, FileLocation, FileType, PackageType, PieceType, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { generateMockToken } from '../../../helpers/auth'
import { db } from '../../../helpers/db'
import { createMockFile, createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment()
})

afterAll(async () => {
    await teardownTestEnvironment()
})

async function engineToken(projectId: string, platformId: string): Promise<string> {
    const principal: Principal = {
        id: apId(),
        type: PrincipalType.ENGINE,
        projectId,
        platform: { id: platformId },
    }
    return generateMockToken(principal)
}

function bundleRequest(name: string, version: string, token: string) {
    return {
        method: 'GET' as const,
        url: `/api/v1/engine/pieces/bundle?name=${encodeURIComponent(name)}&version=${version}`,
        headers: { authorization: `Bearer ${token}` },
    }
}

describe('Piece Bundle Endpoint', () => {
    it('rejects an invalid engine token with 401', async () => {
        const response = await app!.inject(bundleRequest('@activepieces/piece-anything', '1.0.0', 'not-a-real-token'))
        expect(response.statusCode).toBe(StatusCodes.UNAUTHORIZED)
    })

    it('redirects an official piece to the npm tarball when S3 is not configured', async () => {
        const { mockPlatform, mockProject } = await mockAndSaveBasicSetup()
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@activepieces/piece-bundle-official',
            version: '1.2.3',
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            platformId: undefined,
        }))
        const token = await engineToken(mockProject.id, mockPlatform.id)

        const response = await app!.inject(bundleRequest('@activepieces/piece-bundle-official', '1.2.3', token))

        expect(response.statusCode).toBe(StatusCodes.TEMPORARY_REDIRECT)
        expect(response.headers.location).toContain('registry.npmjs.org')
        expect(response.headers.location).toContain('piece-bundle-official-1.2.3.tgz')
    })

    it('scopes custom pieces by the token platform: owner can fetch, other platform gets 404', async () => {
        const platformA = await mockAndSaveBasicSetup()
        const platformB = await mockAndSaveBasicSetup()

        const archiveId = apId()
        await db.save('file', createMockFile({
            id: archiveId,
            platformId: platformA.mockPlatform.id,
            projectId: null,
            type: FileType.PACKAGE_ARCHIVE,
            location: FileLocation.DB,
            compression: FileCompression.NONE,
            data: Buffer.from('fake-tgz-bytes'),
        }))
        await db.save('piece_metadata', createMockPieceMetadata({
            name: '@acme/piece-private',
            version: '0.0.1',
            packageType: PackageType.ARCHIVE,
            pieceType: PieceType.CUSTOM,
            platformId: platformA.mockPlatform.id,
            archiveId,
        }))

        const tokenA = await engineToken(platformA.mockProject.id, platformA.mockPlatform.id)
        const tokenB = await engineToken(platformB.mockProject.id, platformB.mockPlatform.id)

        const ownerResponse = await app!.inject(bundleRequest('@acme/piece-private', '0.0.1', tokenA))
        expect(ownerResponse.statusCode).toBe(StatusCodes.OK)
        expect(ownerResponse.rawPayload.toString()).toBe('fake-tgz-bytes')

        const otherPlatformResponse = await app!.inject(bundleRequest('@acme/piece-private', '0.0.1', tokenB))
        expect(otherPlatformResponse.statusCode).toBe(StatusCodes.NOT_FOUND)
    })
})
