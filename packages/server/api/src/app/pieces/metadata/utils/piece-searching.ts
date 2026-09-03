import { ActionBase, TriggerBase } from '@activepieces/pieces-framework'

import {
    PieceCategory,
    SuggestionType,
} from '@activepieces/shared'
import Fuse from 'fuse.js'
import { PieceMetadataSchema } from '../piece-metadata-entity'

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
        const actions = suggestionType === SuggestionType.ACTION ||
                    suggestionType === SuggestionType.ACTION_AND_TRIGGER
            ? Object.values(piece.actions)
            : []

        const triggers = suggestionType === SuggestionType.TRIGGER ||
                    suggestionType === SuggestionType.ACTION_AND_TRIGGER
            ? Object.values(piece.triggers)
            : []
        return {
            ...piece,
            actions,
            triggers,
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
        ignoreLocation: true,
    })

    const fuseMatches = fuse.search(searchQuery).map(({ item }) => item)

    // Guarantee that an exact/substring name match is never lost to fuzzy ranking:
    // an extra word in the query (e.g. "Discord webhook" vs the piece name "Discord")
    // must still surface the piece. Union the fuzzy hits with any piece whose name or
    // displayName contains a query token.
    const tokens = tokenizeSearchQuery(searchQuery)
    const fuseMatchedNames = new Set(fuseMatches.map((piece) => piece.name))
    const substringMatches = putActionsAndTriggersInAnArray.filter((piece) => {
        if (fuseMatchedNames.has(piece.name)) {
            return false
        }
        return tokens.some((token) => pieceNameHaystack(piece).includes(token))
    })

    return [...fuseMatches, ...substringMatches].map((item) => {
        const suggestedActions = searchForSuggestion({
            actionsOrTriggers: item.actions,
            searchQuery,
            pieceDisplayName: item.displayName,
        })
        const suggestedTriggers = searchForSuggestion({
            actionsOrTriggers: item.triggers,
            searchQuery,
            pieceDisplayName: item.displayName,
        })

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

const MINIMUM_PIECE_NAME_TOKEN_LENGTH = 3

const tokenizeSearchQuery = (searchQuery: string): string[] => {
    return searchQuery.toLowerCase().split(/\s+/).filter((token) => token.length > 0)
}

const pieceNameHaystack = ({ displayName, name }: PieceIdentity): string => {
    return `${displayName} ${name}`.toLowerCase()
}

const splitIntoWords = (value: string): string[] => {
    return value.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 0)
}

const isPrefixOfEitherWay = (token: string, word: string): boolean => {
    return word.startsWith(token) || token.startsWith(word)
}

const tokensNamingThePiece = ({ searchQuery, pieceDisplayName }: PieceNameMatchParams): string[] => {
    const nameWords = splitIntoWords(pieceDisplayName)
    return tokenizeSearchQuery(searchQuery).filter((token) =>
        token.length >= MINIMUM_PIECE_NAME_TOKEN_LENGTH &&
        nameWords.some((word) => isPrefixOfEitherWay(token, word)),
    )
}

const isWholePieceNameTyped = ({ searchQuery, pieceDisplayName }: PieceNameMatchParams): boolean => {
    const tokens = tokenizeSearchQuery(searchQuery)
    return splitIntoWords(pieceDisplayName).every((word) =>
        tokens.some((token) => isPrefixOfEitherWay(token, word)),
    )
}

function toSuggestionRecord<T extends ActionBase | TriggerBase>(actionsOrTriggers: T[]): Record<string, T> {
    return actionsOrTriggers.reduce<Record<string, T>>(
        (suggestions, actionOrTrigger) => ({
            ...suggestions,
            [actionOrTrigger.name]: actionOrTrigger,
        }),
        {},
    )
}

function searchForSuggestion<T extends ActionBase | TriggerBase>({
    actionsOrTriggers,
    searchQuery,
    pieceDisplayName,
}: SearchForSuggestionParams<T>): Record<string, T> {
    if (actionsOrTriggers.length === 0) {
        return {}
    }

    const namingTokens = tokensNamingThePiece({ searchQuery, pieceDisplayName })
    const remainingQuery = namingTokens.length === 0
        ? searchQuery
        : tokenizeSearchQuery(searchQuery).filter((token) => !namingTokens.includes(token)).join(' ')

    if (namingTokens.length > 0 && remainingQuery.length === 0) {
        return toSuggestionRecord(actionsOrTriggers)
    }

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
    const suggestions = nestedFuse.search(remainingQuery)
    if (suggestions.length === 0) {
        const pieceWasNamed = namingTokens.length > 0 && isWholePieceNameTyped({ searchQuery, pieceDisplayName })
        return pieceWasNamed ? toSuggestionRecord(actionsOrTriggers) : {}
    }
    return suggestions.reduce<Record<string, T>>(
        (filteredSuggestions, { item }) => {
            filteredSuggestions[item.name] = {
                ...item,
                pieceDisplayName: undefined,
            }
            return filteredSuggestions
        },
        {},
    )
}

type PieceIdentity = {
    displayName: string
    name: string
}

type PieceNameMatchParams = {
    searchQuery: string
    pieceDisplayName: string
}

type SearchForSuggestionParams<T extends ActionBase | TriggerBase> = {
    actionsOrTriggers: T[]
    searchQuery: string
    pieceDisplayName: string
}
