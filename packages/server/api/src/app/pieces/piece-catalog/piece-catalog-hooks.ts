import { PlatformId } from '@activepieces/core-utils'
import { isPieceVisible, PieceCatalogEventData, PieceSelection } from '@activepieces/shared'
import { hooksFactory } from '../../helper/hooks-factory'

export const pieceCatalogHooks = hooksFactory.create<PieceCatalogHooks>(() => ({
    async listPieceSets(): Promise<Map<PlatformId, PieceSetVisibility[]>> {
        return new Map()
    },
}))

export function pieceSetsContaining({ pieceSets, name }: PieceSetsContainingParams): PieceCatalogEventData['pieceSets'] {
    return pieceSets
        .filter((pieceSet) => isPieceVisible({ pieces: pieceSet.pieces, name }))
        .map((pieceSet) => ({ id: pieceSet.id, key: pieceSet.key, name: pieceSet.name, isDefault: pieceSet.isDefault }))
}

export type PieceCatalogHooks = {
    listPieceSets(params: { platformIds: PlatformId[] }): Promise<Map<PlatformId, PieceSetVisibility[]>>
}

export type PieceSetVisibility = {
    id: string
    key: string | null
    name: string
    isDefault: boolean
    pieces: PieceSelection
}

type PieceSetsContainingParams = {
    pieceSets: PieceSetVisibility[]
    name: string
}
