import { PieceOrderBy, PieceSortBy } from '@activepieces/shared'
import dayjs from 'dayjs'
import { PieceMetadataSchema } from '../../piece-metadata-entity'


export const pieceSorting = {
    sortAndOrder: (
        sortBy: PieceSortBy | undefined,
        orderBy: PieceOrderBy | undefined,
        pieces: PieceMetadataSchema[],
    ): PieceMetadataSchema[] => {
        const sortByDefault = sortBy ?? PieceSortBy.NAME
        const orderByDefault = orderBy ?? PieceOrderBy.ASC
        const sortedPiece = sortPieces(sortByDefault, pieces)

        return reverseIfDesc(orderByDefault, sortedPiece)
    },
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
    return pieces.sort((a, b) =>
        a.projectUsage - b.projectUsage,
    )
}


const sortByName = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) =>
        a.displayName.toLocaleLowerCase().localeCompare(b.displayName.toLocaleLowerCase()),
    )
}

const sortByCreated = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort(
        (a, b) => dayjs(a.created).unix() - dayjs(b.created).unix(),
    )
}

const sortByUpdated = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort(
        (a, b) => dayjs(a.updated).unix() - dayjs(b.updated).unix(),
    )
}
