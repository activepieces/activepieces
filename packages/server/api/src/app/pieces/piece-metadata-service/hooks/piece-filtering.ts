import { PieceCategory } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import Fuse from 'fuse.js'

export const filterPiecesBasedUser = ({
    searchQuery,
    pieces,
    categories,
}: {
    categories: PieceCategory[] | undefined
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
}): PieceMetadataSchema[] => {
    return filterBasedOnCategories({
        categories,
        pieces: filterBasedOnSearchQuery({ searchQuery, pieces }),
    })
}

const filterBasedOnSearchQuery = ({
    searchQuery,
    pieces,
}: {
    searchQuery: string | undefined
    pieces: PieceMetadataSchema[]
}): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }
    const fuse = new Fuse(pieces, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: [
            {
                name: 'name',
                weight: 5,
            },
            {
                name: 'description',
                weight: 5,
            },
        ],
        threshold: 0.3,
    })

    return fuse
        .search(searchQuery)
        .map(({ item }) => pieces.find((p) => p.name === item.name)!)
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
