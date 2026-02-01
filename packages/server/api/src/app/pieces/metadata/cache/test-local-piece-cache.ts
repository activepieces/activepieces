import { pieceTranslation } from '@activepieces/pieces-framework'
import { isNil, LocalesEnum } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { PieceMetadataSchema } from '../piece-metadata-entity'
import { fetchPiecesFromDB, filterPieceBasedOnType, lastVersionOfEachPiece, loadDevPiecesIfEnabled } from '../utils'
import { GetListParams, GetPieceVersionParams, GetRegistryParams, LocalPieceCache, PieceRegistryEntry } from '.'

export const testLocalPieceCache = (log: FastifyBaseLogger): LocalPieceCache => ({
    async setup(): Promise<void> {
        return
    },
    async refresh(): Promise<void> {
        return
    },
    async getList(params: GetListParams): Promise<PieceMetadataSchema[]> {
        const { platformId, locale = LocalesEnum.ENGLISH } = params
        const pieces = await fetchPiecesFromDB()
        const devPieces = await loadDevPiecesIfEnabled(log)
        const translatedDevPieces = devPieces.map((piece) => pieceTranslation.translatePiece<PieceMetadataSchema>({ piece, locale, mutate: true }))
        
        return [...lastVersionOfEachPiece(pieces), ...translatedDevPieces]
            .filter((piece) => filterPieceBasedOnType(platformId, piece))
    },
    async getPieceVersion(params: GetPieceVersionParams): Promise<PieceMetadataSchema | null> {
        const { pieceName, version } = params
        const pieces = await fetchPiecesFromDB()
        const devPieces = await loadDevPiecesIfEnabled(log)
        const devPiece = devPieces.find(p => p.name === pieceName && p.version === version)
        if (!isNil(devPiece)) {
            return devPiece
        }
        return pieces.find(p => p.name === pieceName && p.version === version) ?? null
    },
    async getRegistry(_params: GetRegistryParams): Promise<PieceRegistryEntry[]> {
        const pieces = await fetchPiecesFromDB()
        const devPieces = await loadDevPiecesIfEnabled(log)
        
        const registry = pieces.map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
            platformId: piece.platformId,
            pieceType: piece.pieceType,
        }))
        
        const devRegistry = devPieces.map(piece => ({
            name: piece.name,
            version: piece.version,
            minimumSupportedRelease: piece.minimumSupportedRelease,
            maximumSupportedRelease: piece.maximumSupportedRelease,
            platformId: piece.platformId,
            pieceType: piece.pieceType,
        }))
        
        return [...registry, ...devRegistry]
    },
})
