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

const PIECE_SEARCH_KEYS = [
    { name: 'displayName', weight: 3 },
    { name: 'description', weight: 1 },
    'actions.displayName',
    'actions.description',
    'triggers.displayName',
    'triggers.description',
]

const MINIMUM_PIECE_NAME_TOKEN_LENGTH = 3

const filterBasedOnSearchQuery = ({ searchQuery, pieces, suggestionType }: SearchParams): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }
    const includeActions = suggestionType === SuggestionType.ACTION || suggestionType === SuggestionType.ACTION_AND_TRIGGER
    const includeTriggers = suggestionType === SuggestionType.TRIGGER || suggestionType === SuggestionType.ACTION_AND_TRIGGER
    const searchablePieces = pieces.map((piece) => ({
        ...piece,
        actions: includeActions ? Object.values(piece.actions) : [],
        triggers: includeTriggers ? Object.values(piece.triggers) : [],
    }))

    const fuse = new Fuse(searchablePieces, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: PIECE_SEARCH_KEYS,
        threshold: 0.2,
        distance: 250,
        ignoreLocation: true,
    })

    const fuseMatches = fuse.search(searchQuery).map(({ item }) => item)
    const fuseMatchedNames = new Set(fuseMatches.map((piece) => piece.name))
    const tokens = tokenizeSearchQuery(searchQuery)
    const substringMatches = searchablePieces.filter((piece) =>
        !fuseMatchedNames.has(piece.name) &&
        tokens.some((token) => pieceNameHaystack(piece).includes(token)),
    )

    return [...fuseMatches, ...substringMatches].map((piece) => ({
        ...piece,
        actions: searchForSuggestion({ actionsOrTriggers: piece.actions, searchQuery, pieceDisplayName: piece.displayName }),
        triggers: searchForSuggestion({ actionsOrTriggers: piece.triggers, searchQuery, pieceDisplayName: piece.displayName }),
    }))
}

const filterBasedOnCategories = (categories: PieceCategory[] | undefined, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    if (!categories) {
        return pieces
    }

    return pieces.filter((p) => {
        return categories.some((item) => (p.categories ?? []).includes(item))
    })
}

const tokenizeSearchQuery = (searchQuery: string): string[] => {
    return searchQuery.toLowerCase().split(/\s+/).filter((token) => token.length > 0)
}

const pieceNameHaystack = ({ displayName, name }: PieceIdentity): string => {
    return `${displayName} ${name}`.toLowerCase()
}

const isPrefixOfEitherWay = (token: string, word: string): boolean => {
    return word.startsWith(token) || token.startsWith(word)
}

const matchPieceName = ({ searchQuery, pieceDisplayName }: PieceNameMatchParams): PieceNameMatch => {
    const tokens = tokenizeSearchQuery(searchQuery)
    const nameWords = pieceDisplayName.toLowerCase().split(/[^a-z0-9]+/).filter((word) => word.length > 0)
    const namingTokens = tokens.filter((token) =>
        token.length >= MINIMUM_PIECE_NAME_TOKEN_LENGTH &&
        nameWords.some((word) => isPrefixOfEitherWay(token, word)),
    )
    return {
        pieceWasNamed: namingTokens.length > 0,
        remainingQuery: tokens.filter((token) => !namingTokens.includes(token)).join(' '),
        wholeNameTyped: nameWords.every((word) => tokens.some((token) => isPrefixOfEitherWay(token, word))),
    }
}

function toSuggestionRecord<T extends { name: string }>(actionsOrTriggers: T[]): Record<string, T> {
    return Object.fromEntries(actionsOrTriggers.map((actionOrTrigger) => [actionOrTrigger.name, actionOrTrigger]))
}

function searchForSuggestion<T extends ActionBase | TriggerBase>({
    actionsOrTriggers,
    searchQuery,
    pieceDisplayName,
}: SearchForSuggestionParams<T>): Record<string, T> {
    if (actionsOrTriggers.length === 0) {
        return {}
    }

    const { pieceWasNamed, remainingQuery, wholeNameTyped } = matchPieceName({ searchQuery, pieceDisplayName })
    if (pieceWasNamed && remainingQuery.length === 0) {
        return toSuggestionRecord(actionsOrTriggers)
    }

    const nestedFuse = new Fuse(
        actionsOrTriggers.map((actionOrTrigger) => ({ ...actionOrTrigger, pieceDisplayName })),
        {
            isCaseSensitive: false,
            shouldSort: true,
            keys: ['pieceDisplayName', 'displayName', 'description'],
            threshold: 0.2,
        },
    )

    const suggestions = nestedFuse.search(remainingQuery)
    if (suggestions.length === 0) {
        return pieceWasNamed && wholeNameTyped ? toSuggestionRecord(actionsOrTriggers) : {}
    }
    return toSuggestionRecord(suggestions.map(({ item }) => ({ ...item, pieceDisplayName: undefined })))
}

type SearchParams = {
    categories: PieceCategory[] | undefined
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
    suggestionType?: SuggestionType
}

type PieceIdentity = {
    displayName: string
    name: string
}

type PieceNameMatchParams = {
    searchQuery: string
    pieceDisplayName: string
}

type PieceNameMatch = {
    pieceWasNamed: boolean
    remainingQuery: string
    wholeNameTyped: boolean
}

type SearchForSuggestionParams<T extends ActionBase | TriggerBase> = {
    actionsOrTriggers: T[]
    searchQuery: string
    pieceDisplayName: string
}
