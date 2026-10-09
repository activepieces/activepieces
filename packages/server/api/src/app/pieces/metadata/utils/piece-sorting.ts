import { PieceOrderBy, PieceSortBy } from '@activepieces/shared'
import dayjs from 'dayjs'
import { PieceMetadataSchema } from '../piece-metadata-entity'

/**
 * Sorting for the piece list.
 *
 * Synkra override: our own pieces (names starting with @synkra/) always sort
 * to the top of the list, regardless of the sort mode requested. Category
 * filtering happens after this, so @synkra pieces only appear first in the
 * categories they belong to. In Finance they are absent entirely.
 */

const SYN_KRA_PREFIX = '@synkra/'

export const pieceSorting = {
    sortAndOrder: (
        sortBy: PieceSortBy | undefined,
        orderBy: PieceOrderBy | undefined,
        pieces: PieceMetadataSchema[],
    ): PieceMetadataSchema[] => {
        const sortByDefault = sortBy ?? PieceSortBy.NAME
        const orderByDefault = orderBy ?? PieceOrderBy.ASC
        const sortedPiece = sortPieces(sortByDefault, pieces)
        const ordered = reverseIfDesc(orderByDefault, sortedPiece)
        return hoistSynkraFirst(ordered)
    },
}

function hoistSynkraFirst(
    pieces: PieceMetadataSchema[],
): PieceMetadataSchema[] {
    const ours: PieceMetadataSchema[] = []
    const others: PieceMetadataSchema[] = []
    for (const piece of pieces) {
        if (piece.name.startsWith(SYN_KRA_PREFIX)) {
            ours.push(piece)
        } else {
            others.push(piece)
        }
    }
    // Alphabetical within our own pieces, so the order is stable.
    ours.sort((a, b) =>
        a.displayName.toLocaleLowerCase().localeCompare(b.displayName.toLocaleLowerCase()),
    )
    return [...ours, ...others]
}

const sortPieces = (
    sortBy: PieceSortBy | undefined,
    pieces: PieceMetadataSchema[],
): PieceMetadataSchema[] => {
    const sortByDefault = sortBy ?? PieceSortBy.NAME
    switch (sortByDefault) {
        case PieceSortBy.POPULARITY: {
            return sortByPopularity(pieces)
        }
        case PieceSortBy.NAME: {
            return sortByName(pieces)
        }
        case PieceSortBy.UPDATED: {
            return sortByUpdated(pieces)
        }
        case PieceSortBy.CREATED: {
            return sortByCreated(pieces)
        }
    }
}

const reverseIfDesc = (
    orderBy: PieceOrderBy,
    pieces: PieceMetadataSchema[],
): PieceMetadataSchema[] => {
    if (orderBy === PieceOrderBy.ASC) {
        return pieces
    }
    return pieces.reverse()
}

const sortByPopularity = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) => a.projectUsage - b.projectUsage)
}

const sortByName = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) =>
        a.displayName.toLocaleLowerCase().localeCompare(b.displayName.toLocaleLowerCase()),
    )
}

const sortByUpdated = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) =>
        dayjs(a.updated).diff(dayjs(b.updated)),
    )
}

const sortByCreated = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) =>
        dayjs(a.created).diff(dayjs(b.created)),
    )
}
