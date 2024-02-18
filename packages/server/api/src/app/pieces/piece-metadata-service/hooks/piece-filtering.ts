import { PieceCategory } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import Fuse from 'fuse.js'
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'


const defaultFilterKeys = [  {
    name: 'displayName',
    weight: 5,
},
{
    name: 'description',
    weight: 5,
}] 

export const filterPiecesBasedUser = ({
    searchQuery,
    pieces,
    categories,
    includeActionsAndTriggers,
}: {
    categories: PieceCategory[] | undefined
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    includeActionsAndTriggers?: boolean
}): PieceMetadataSchema[] => {
    return filterBasedOnCategories({
        categories,
        pieces: filterBasedOnSearchQuery({ searchQuery, pieces, includeActionsAndTriggers  }),
    })
}

const filterBasedOnSearchQuery = ({
    searchQuery,
    pieces,
    includeActionsAndTriggers,
}: {
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    includeActionsAndTriggers?: boolean
}): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }
    if (includeActionsAndTriggers) {
        return searchWithinActionsAndTriggersAsWell(searchQuery, pieces)
    }
    const fuse = new Fuse(pieces, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: 
        defaultFilterKeys,
        threshold: 0.3,
    })

    return fuse
        .search(searchQuery)
        .map(({ item }) => item)
}

const filterBasedOnCategories = ({
    categories,
    pieces,
}: {
    categories: PieceCategory[] | undefined
    pieces: PieceMetadataSchema[]
}): PieceMetadataSchema[] => {
    if (!categories) {
        return pieces
    }

    return pieces.filter((p) => {
        return categories.some((item) => (p.categories ?? []).includes(item))
    })
}


const searchWithinActionsAndTriggersAsWell = (searchQuery: string, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    const putActionsAndTriggersInAnArray = pieces.map((piece) => {
        const actions = Object.keys(piece.actions).map((name) => piece.actions[name])
        const triggers = Object.keys(piece.triggers).map((name) => piece.triggers[name])

        return {
            ...piece,
            actions,
            triggers,
        }
    })

    const keysInAdditionToActionsAndTriggers = [ 
        ...defaultFilterKeys,
        {
            name: 'actions.displayName',
            weight: 5,
        },
        {
            name: 'actions.description',
            weight: 5,
        },
        {
            name: 'triggers.description',
            weight: 5,
        },
        {
            name: 'triggers.displayName',
            weight: 5,
        },
    ]
    const fuse = new Fuse(putActionsAndTriggersInAnArray, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: 
        keysInAdditionToActionsAndTriggers,
        threshold: 0.2,
    })

    return fuse
        .search(searchQuery)
        .map(({ item }) => {
            const originalPiece = pieces.find((p) => p.id === item.id)!
            
            const { suggestedActionsAndTriggers } = searchForRelatedActionsAndTriggers(originalPiece, searchQuery)
                    
            const actions = suggestedActionsAndTriggers.reduce<Record<string, ActionBase>>((filteredActions, suggestion) => {
                if (suggestion.key in originalPiece.actions) {
                    filteredActions[suggestion.key] = originalPiece.actions[suggestion.key]
                }
                return filteredActions
            }, {})

            const triggers = suggestedActionsAndTriggers.reduce<Record<string, TriggerBase>>((filteredTriggers, suggestion) => { 
                if (suggestion.key in originalPiece.triggers) {
                    filteredTriggers[suggestion.key] = originalPiece.triggers[suggestion.key]
                }
                return filteredTriggers
            }
            , {})
            return {
                ...originalPiece,
                actions,
                triggers,
            }
            
        })

}
function searchForRelatedActionsAndTriggers(originalPiece: PieceMetadataSchema, searchQuery: string):
{
    suggestedActionsAndTriggers: { description: string, displayName: string, key: string }[]
} {
  
    const actionsAndTriggers = [
        ...Object.keys(originalPiece.actions).map((key) => ({
            description: originalPiece.actions[key].description,
            displayName: originalPiece.actions[key].displayName,
            key,
        })),
        ...Object.keys(originalPiece.triggers).map((key) => ({
            description: originalPiece.triggers[key].description,
            displayName: originalPiece.triggers[key].displayName,
            key,
        })),
    ]
    const suggestionLimit = 3
    const nestedFuse = new Fuse(actionsAndTriggers, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: ['displayName', 'description'],
        threshold: 0.2,
    })

    const suggestedActionsAndTriggers = nestedFuse.search(searchQuery, { limit: suggestionLimit }).map(({ item }) => item)
    return { suggestedActionsAndTriggers }
}

