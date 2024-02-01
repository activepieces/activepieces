
import { PlatformId } from '@activepieces/ee-shared'
import Fuse from 'fuse.js'
import { PieceMetadataModel } from '../piece-metadata-entity'

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
    filterPieces(p: FilterPiecesParams): Promise<PieceMetadataModel[]>
}

export type FilterPiecesParams = {
    includeHidden?: boolean
    platformId?: PlatformId
    searchQuery?: string
    pieces: PieceMetadataModel[]
}

export const filterPieceBasedOnSearchQuery = ({ searchQuery, pieces }: { searchQuery: string | undefined, pieces: PieceMetadataModel[] }): PieceMetadataModel[] => {
    if (!searchQuery) {
        return pieces
    }
    if (searchQuery.length <= 2) {
        const fuse = new Fuse(pieces, {
            keys: ['name', 'description'],
            threshold: 0.2,
        })

        return fuse.search(searchQuery).map(({ item }) => item)
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
        threshold: 0.2,
        shouldSort: true,
    })
      
    return fuse.search(searchQuery).map(({ item })=> item)
     
}