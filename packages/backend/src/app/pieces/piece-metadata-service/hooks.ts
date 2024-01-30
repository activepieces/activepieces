import { PieceMetadataSchema } from '../piece-metadata-entity'
import { PlatformId } from '@activepieces/ee-shared'
import Fuse from 'fuse.js'

const defaultPieceHooks: PieceMetadataServiceHooks = {
    async filterPieces(params) {
        return filterPieceBasedOnSearchQuery({
            searchQuery: params.searchQuery,
            pieces: params.pieces,
        })
    },
}

let hooks = defaultPieceHooks

export const pieceMetadataServiceHooks = {
    set(newHooks: PieceMetadataServiceHooks): void {
        hooks = newHooks
    },

    get(): PieceMetadataServiceHooks {
        return hooks
    },
}

export type PieceMetadataServiceHooks = {
    filterPieces(p: FilterPiecesParams): Promise<PieceMetadataSchema[]>
}

export type FilterPiecesParams = {
    includeHidden?: boolean
    platformId?: PlatformId
    searchQuery?: string
    pieces: PieceMetadataSchema[]
}

export const filterPieceBasedOnSearchQuery = ({ searchQuery, pieces }: { searchQuery: string | undefined, pieces: PieceMetadataSchema[] }): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }

    const convertPieces = pieces.map(p => ({
        ...p,
        actionOrTrigger: [...Object.values(p.actions).map(a => {
            return {
                name: a.name,
                description: a.description,
            }
        }), ...Object.values(p.triggers).map(t => {
            return {
                name: t.name,
                description: t.description,
            }
        })],
    }))
    const fuse = new Fuse(convertPieces, {
        keys: ['name', 'description', 'actionOrTrigger.name', 'actionOrTrigger.description'],
        threshold: 0.3,
    })

    return fuse.search(searchQuery).map(({ item }) => pieces.find(p => p.name === item.name)!)
}