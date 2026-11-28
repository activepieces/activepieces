import { apId, PackageType, PieceScope, PieceType } from '@activepieces/shared'
import { FastifyInstance } from 'fastify'
import { vi } from 'vitest'
import { databaseConnection } from '../../../../src/app/database/database-connection'

const { engineOutput } = vi.hoisted(() => ({ engineOutput: { value: {} as Record<string, unknown> } }))
vi.mock('../../../../src/app/workers/user-interaction-watcher', () => ({
    userInteractionWatcher: {
        submitAndWaitForResponse: async () => ({ status: 'OK', response: engineOutput.value }),
    },
}))

import { PieceMetadataEntity, PieceMetadataSchema } from '../../../../src/app/pieces/metadata/piece-metadata-entity'
import { pieceMetadataService } from '../../../../src/app/pieces/metadata/piece-metadata-service'
import { pieceInstallService } from '../../../../src/app/pieces/piece-install-service'
import { createMockPieceMetadata, mockAndSaveBasicSetup } from '../../../helpers/mocks'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance | null = null

beforeAll(async () => {
    app = await setupTestEnvironment({ fresh: true })
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('Custom piece install', () => {
    it('saves the piece under the installing platform when its metadata names another platform', async () => {
        const installer = await mockAndSaveBasicSetup()
        const other = await mockAndSaveBasicSetup()
        const name = '@test/piece-names-other-platform'
        engineOutput.value = { ...pieceMetadata(name), platformId: other.mockPlatform.id }

        await install({ platformId: installer.mockPlatform.id, name })

        expect(await rowsFor(name)).toEqual([{ platformId: installer.mockPlatform.id, pieceType: PieceType.CUSTOM, packageType: PackageType.REGISTRY, archiveId: null }])
    })

    it('saves the piece as custom when its metadata says official', async () => {
        const installer = await mockAndSaveBasicSetup()
        const name = '@test/piece-says-official'
        engineOutput.value = { ...pieceMetadata(name), platformId: null, pieceType: PieceType.OFFICIAL, packageType: PackageType.ARCHIVE, archiveId: apId() }

        await install({ platformId: installer.mockPlatform.id, name })

        expect(await rowsFor(name)).toEqual([{ platformId: installer.mockPlatform.id, pieceType: PieceType.CUSTOM, packageType: PackageType.REGISTRY, archiveId: null }])
    })

    it('does not overwrite an existing row when its metadata reuses that row id', async () => {
        const installer = await mockAndSaveBasicSetup()
        const officialName = '@test/piece-official'
        const { piece: official } = await pieceMetadataService(app!.log).create({
            pieceMetadata: createMockPieceMetadata({ name: officialName, version: '1.0.0', pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, platformId: undefined }),
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
        })
        const name = '@test/piece-reuses-id'
        engineOutput.value = { ...pieceMetadata(name), id: official.id }

        await install({ platformId: installer.mockPlatform.id, name })

        expect(await rowsFor(officialName)).toEqual([{ platformId: null, pieceType: PieceType.OFFICIAL, packageType: PackageType.REGISTRY, archiveId: null }])
        const installed = await databaseConnection().getRepository(PieceMetadataEntity).findOneByOrFail({ name })
        expect(installed.id).not.toBe(official.id)
    })
})

async function install({ platformId, name }: { platformId: string, name: string }): Promise<void> {
    await pieceInstallService(app!.log).installPiece(platformId, {
        packageType: PackageType.REGISTRY,
        scope: PieceScope.PLATFORM,
        pieceName: name,
        pieceVersion: '1.0.0',
    })
}

async function rowsFor(name: string): Promise<Pick<PieceMetadataSchema, 'platformId' | 'pieceType' | 'packageType' | 'archiveId'>[]> {
    return databaseConnection().getRepository(PieceMetadataEntity).find({
        where: { name },
        select: { platformId: true, pieceType: true, packageType: true, archiveId: true },
    })
}

function pieceMetadata(name: string): Record<string, unknown> {
    return {
        name,
        version: '1.0.0',
        displayName: name,
        description: '',
        logoUrl: 'https://cdn.activepieces.com/pieces/test.png',
        authors: [],
        actions: {},
        triggers: {},
        categories: [],
    }
}
