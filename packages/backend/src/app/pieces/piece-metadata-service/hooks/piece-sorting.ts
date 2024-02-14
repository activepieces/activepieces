
import { PieceSortBy, PieceOrderBy } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import dayjs from 'dayjs'

export const sortAndOrderPieces = (sortBy: PieceSortBy | undefined, orderBy: PieceOrderBy | undefined, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    const sortByDefault = sortBy ?? PieceSortBy.NAME
    const orderByDefault = orderBy ?? PieceOrderBy.ASC
    const sortedPiece = sortPieces(sortByDefault, pieces)

    return reverseIfDesc(orderByDefault, sortedPiece)
}

const sortPieces = (sortBy: PieceSortBy | undefined, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    const sortByDefault = sortBy ?? PieceSortBy.NAME
    switch (sortByDefault) {
        case PieceSortBy.NAME: {
            return sortByName(pieces)
        }
        case PieceSortBy.DATE: {
            return sortByDate(pieces)
        }
    }
}
const reverseIfDesc = (orderBy: PieceOrderBy, pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    if (orderBy === PieceOrderBy.ASC) {
        return pieces
    }
    return pieces.reverse()
}

const sortByName = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()))
}

const sortByDate = (pieces: PieceMetadataSchema[]): PieceMetadataSchema[] => {
    return pieces.sort((a, b) => dayjs(a.created).unix() - dayjs(b.created).unix())
}

