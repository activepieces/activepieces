import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'

import {
    PieceCategory,
    SuggestionType,
} from '@activepieces/shared'
import Fuse from 'fuse.js'
import { PieceMetadataSchema } from '../../piece-metadata-entity'

export const pieceSearching = {
    search: (params: SearchParams): PieceMetadataSchema[] => {
        return filterBasedOnCategories(params.categories, filterBasedOnSearchQuery(params))
    },
}

type SearchParams = {
    categories: PieceCategory[] | undefined
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    suggestionType?: SuggestionType
}


const filterBasedOnSearchQuery = ({ searchQuery, pieces, suggestionType }: SearchParams): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }
    const putActionsAndTriggersInAnArray = pieces.map((piece) => {
        const actions = Object.values(piece.actions)
        const triggers = Object.values(piece.triggers)
        return {
            ...piece,
            actions:
                suggestionType === SuggestionType.ACTION ||
                    suggestionType === SuggestionType.ACTION_AND_TRIGGER
                    ? actions
                    : [],
            triggers:
                suggestionType === SuggestionType.TRIGGER ||
                    suggestionType === SuggestionType.ACTION_AND_TRIGGER
                    ? triggers
                    : [],
        }
    })

    const pieceWithTriggersAndActionsFilterKeys = [
        {
            name: 'displayName',
            weight: 3,
        },
        {
            name: 'description',
            weight: 1,
        },
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
        distance: 250,
    })

    return fuse.search(searchQuery).map(({ item }) => {
        const suggestedActions = searchForSuggestion(
            item.actions,
            searchQuery,
            item.displayName,
        )
        const suggestedTriggers = searchForSuggestion(
            item.triggers,
            searchQuery,
            item.displayName,
        )

        return {
            ...item,
            actions: suggestedActions,
            triggers: suggestedTriggers,
        }
    })
}

const filterBasedOnCategories = (categories: PieceCategory[] | undefined, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    if (!categories) {
        return pieces
    }

    return pieces.filter((p) => {
        return categories.some((item) => (p.categories ?? []).includes(item))
    })
}

function searchForSuggestion<T extends ActionBase | TriggerBase>(
    actionsOrTriggers: T[],
    searchQuery: string,
    pieceDisplayName: string,
): Record<string, T> {
    const actionsOrTriggerWithPieceDisplayName = actionsOrTriggers.map(
        (actionOrTrigger) => ({
            ...actionOrTrigger,
            pieceDisplayName,
        }),
    )

    const nestedFuse = new Fuse(actionsOrTriggerWithPieceDisplayName, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: ['pieceDisplayName', 'displayName', 'description'],
        threshold: 0.2,
    })
    const suggestions = nestedFuse.search(searchQuery).map(({ item }) => item)
    return suggestions.reduce<Record<string, T>>(
        (filteredSuggestions, suggestion) => {
            filteredSuggestions[suggestion.name] = {
                ...suggestion,
                pieceDisplayName: undefined,
            }
            return filteredSuggestions
        },
        {},
    )
}
