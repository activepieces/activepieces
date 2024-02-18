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
            const originalPiece = { ...pieces.find((p) => p.id === item.id)! }
            originalPiece.actions
            const foundActionsKeys = Object.keys(originalPiece.actions)
                .filter((name)=> item.actions.findIndex(a=> a.name === originalPiece.actions[name].name) > -1)
            
            const foundATriggersKeys = Object.keys(originalPiece.triggers)
                .filter((name)=> item.triggers.findIndex(a=> a.name === originalPiece.triggers[name].name) > -1)
             
            
            const actions = foundActionsKeys.reduce<Record<string, ActionBase>>((filteredActions, key) => {
                filteredActions[key] = originalPiece.actions[key]
                return filteredActions
            }, {})

            const triggers = foundATriggersKeys.reduce<Record<string, TriggerBase>>((filteredTriggers, key) => { 
                filteredTriggers[key] = originalPiece.triggers[key]
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
