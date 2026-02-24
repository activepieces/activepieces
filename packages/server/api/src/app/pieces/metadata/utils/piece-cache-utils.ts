import { AppSystemProp, filePiecesUtils } from '@activepieces/server-shared'
import { apId, isEmpty, isNil, PackageType, PieceType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import semVer from 'semver'
import { system } from '../../../helper/system/system'
import { PieceRegistryEntry } from '../piece-cache'
import { PieceMetadataSchema } from '../piece-metadata-entity'

export function sortByNameAndVersionDesc(a: PieceMetadataSchema, b: PieceMetadataSchema): number {
    if (a.name !== b.name) {
        return a.name.localeCompare(b.name)
    }
    const aValid = semVer.valid(a.version)
    const bValid = semVer.valid(b.version)
    if (!aValid && !bValid) {
        return b.version.localeCompare(a.version)
    }
    if (!aValid) {
        return 1
    }
    if (!bValid) {
        return -1
    }
    return semVer.rcompare(a.version, b.version)
}

export function lastVersionOfEachPiece(pieces: PieceMetadataSchema[]): PieceMetadataSchema[] {
    const seen = new Map<string, PieceMetadataSchema>()
    for (const piece of pieces) {
        if (!seen.has(piece.name)) {
            seen.set(piece.name, piece)
        }
    }
    return Array.from(seen.values())
}

export async function loadDevPiecesIfEnabled(log: FastifyBaseLogger): Promise<PieceMetadataSchema[]> {
    const devPiecesConfig = system.get(AppSystemProp.DEV_PIECES)
    if (isNil(devPiecesConfig) || isEmpty(devPiecesConfig)) {
        return []
    }
    const piecesNames = devPiecesConfig.split(',')
    const pieces = await filePiecesUtils(log).loadDistPiecesMetadata(piecesNames)

    return pieces.map((p): PieceMetadataSchema => ({
        id: apId(),
        ...p,
        projectUsage: 0,
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
    }))
}

export function filterPieceBasedOnType(platformId: string | undefined, piece: PieceMetadataSchema | PieceRegistryEntry): boolean {
    return isOfficialPiece(piece) || isCustomPiece(platformId, piece)
}

export function isOfficialPiece(piece: PieceMetadataSchema | PieceRegistryEntry): boolean {
    return piece.pieceType === PieceType.OFFICIAL && isNil(piece.platformId)
}

export function isCustomPiece(platformId: string | undefined, piece: PieceMetadataSchema | PieceRegistryEntry): boolean {
    if (isNil(platformId)) {
        return false
    }
    return piece.platformId === platformId && piece.pieceType === PieceType.CUSTOM
}

export function isSupportedRelease(release: string | undefined, piece: { minimumSupportedRelease?: string, maximumSupportedRelease?: string }): boolean {
    if (isNil(release)) {
        return true
    }
    if (!semVer.valid(release) || !semVer.valid(piece.minimumSupportedRelease) || !semVer.valid(piece.maximumSupportedRelease)) {
        return false
    }

    if (!isNil(piece.maximumSupportedRelease) && semVer.compare(release, piece.maximumSupportedRelease) == 1) {
        return false
    }
    if (!isNil(piece.minimumSupportedRelease) && semVer.compare(release, piece.minimumSupportedRelease) == -1) {
        return false
    }
    return true
}

export function binarySearchInsertIndex(list: PieceMetadataSchema[], piece: PieceMetadataSchema): number {
    let low = 0
    let high = list.length
    while (low < high) {
        const mid = (low + high) >>> 1
        if (sortByNameAndVersionDesc(piece, list[mid]) > 0) {
            high = mid
        }
        else {
            low = mid + 1
        }
    }
    return low
}
