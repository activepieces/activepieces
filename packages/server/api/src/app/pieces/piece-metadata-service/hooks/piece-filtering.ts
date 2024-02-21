import { PieceCategory, SuggestionType } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import Fuse from 'fuse.js'
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'


const pieceFilterKeys = [{
    name: 'displayName',
    weight: 2,
}, {
    name: 'description',
    weight: 1,
}]

const suggestionLimit = 3
export const filterPiecesBasedUser = ({
    searchQuery,
    pieces,
    categories,
    suggestionType,
}: {
    categories: PieceCategory[] | undefined
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    suggestionType?: SuggestionType
}): PieceMetadataSchema[] => {
    return filterBasedOnCategories({
        categories,
        pieces: filterBasedOnSearchQuery({ searchQuery, pieces, suggestionType }),
    })
}

const filterBasedOnSearchQuery = ({
    searchQuery,
    pieces,
    suggestionType,
}: {
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    suggestionType?: SuggestionType
}): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }
    const putActionsAndTriggersInAnArray = pieces.map((piece) => {
        const actions = Object.values(piece.actions)
        const triggers = Object.values(piece.triggers)
        return {
            ...piece,
            actions: suggestionType === SuggestionType.ACTION || suggestionType === SuggestionType.ACTION_AND_TRIGGER ? actions : [],
            triggers: suggestionType === SuggestionType.TRIGGER || suggestionType === SuggestionType.ACTION_AND_TRIGGER ? triggers : [],
        }
    })

    const pieceWithTriggersAndActionsFilterKeys = [
        ...pieceFilterKeys,
        'actions.displayName',
        'actions.description',
        'triggers.displayName',
        'triggers.description',
    ]
    const fuse = new Fuse(putActionsAndTriggersInAnArray, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: pieceWithTriggersAndActionsFilterKeys,
        threshold: 0.2,
    })

    return fuse
        .search(searchQuery)
        .map(({ item }) => {
            const suggestedActions = searchForSuggestion(item.actions, searchQuery)
            const suggestedTriggers = searchForSuggestion(item.triggers, searchQuery)
            return {
                ...item,
                actions: suggestedActions,
                triggers: suggestedTriggers,
            }
        })
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


function searchForSuggestion<T extends ActionBase | TriggerBase>(actions: T[], searchQuery: string): Record<string, T> {
    const nestedFuse = new Fuse(actions, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: ['displayName', 'description'],
        threshold: 0.2,
    })
    const suggestions = nestedFuse.search(searchQuery, { limit: suggestionLimit }).map(({ item }) => item)
    return suggestions.reduce<Record<string, T>>((filteredSuggestions, suggestion) => {
        filteredSuggestions[suggestion.name] = suggestion
        return filteredSuggestions
    }, {})
}

