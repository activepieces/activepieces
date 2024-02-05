
import { PlatformId } from '@activepieces/ee-shared'
import Fuse from 'fuse.js'
import { PieceMetadataModel, PieceMetadataModelSummary } from '../piece-metadata-entity'
const MAX_NUMBER_OF_ACTIONS_OR_TRIGGERS = 3
const SEARCH_QUERY_MIN_LENGTH = 3
const SEARCH_THRESHOLD = 0.2
const defaultPieceHooks: PieceMetadataServiceHooks = {
    async filterPieces(params) {
        return filterPieceBasedOnSearchQuery({
            searchQuery: params.searchQuery,
            pieces: params.pieces,
            onlyPieces: params.onlyPieces,
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
    filterPieces(p: FilterPiecesParams): Promise<PieceMetadataModelSummary[]>
}

export type FilterPiecesParams = {
    includeHidden?: boolean
    platformId?: PlatformId
    searchQuery?: string
    pieces: PieceMetadataModel[]
    onlyPieces?: boolean
}

export const filterPieceBasedOnSearchQuery = ({ searchQuery, pieces, onlyPieces }: { searchQuery?: string, pieces: PieceMetadataModel[], onlyPieces?: boolean  }): PieceMetadataModelSummary[] => {
    if (!searchQuery) {
        return pieces.map(summerizePiece)
    }
    
    if (searchQuery.length < SEARCH_QUERY_MIN_LENGTH || onlyPieces) {
        const fuse = new Fuse(pieces, {
            keys: ['name', 'description'],
            threshold: SEARCH_THRESHOLD,
            shouldSort: true,
        })
        return fuse.search(searchQuery).map(({ item }) => summerizePiece(item))
    }
  
    const convertPieces = pieces.map(p => ({
        ...summerizePiece(p),
        actions: [...Object.values(p.actions).map(a => {
            return {
                name: a.name,
                description: a.description,
                displayName: a.displayName,
            }
        })],
        triggers: [ ...Object.values(p.triggers).map(t => {
            return {
                name: t.name,
                description: t.description,
                displayName: t.displayName,
            }
        })],
    }))
    
    const fuse = new Fuse(convertPieces, {
        keys: ['name', 'description', 'actions.name', 'triggers.name', 'triggers.displayName', 'actions.displayName', 'actions.description', 'triggers.description'],
        threshold: SEARCH_THRESHOLD,
        shouldSort: true,
    })
      
    return fuse.search(searchQuery).map(({ item })=>{
        return {
            ...item,
            actions: item.actions.map(a=>{
                return {
                    name: a.name,
                    displayName: a.displayName,
                }
            
            }).slice(0, MAX_NUMBER_OF_ACTIONS_OR_TRIGGERS),
            triggers: item.triggers.map(t=>{
                return {
                    name: t.name,
                    displayName: t.displayName,
                }
            }).slice(0, MAX_NUMBER_OF_ACTIONS_OR_TRIGGERS),
        }
    }) 
     
}

const summerizePiece = (piece: PieceMetadataModel): PieceMetadataModelSummary => {

    return {
        ...piece,
        actions: Object.values(piece.actions).map(a => {
            return {
                name: a.name,
                displayName: a.displayName,
             
            }
        }).slice(0, MAX_NUMBER_OF_ACTIONS_OR_TRIGGERS),
        triggers: Object.values(piece.triggers).map(t => {
            return {
                name: t.name,
                displayName: t.displayName,
            }
        }).slice(0, MAX_NUMBER_OF_ACTIONS_OR_TRIGGERS),
    }
}