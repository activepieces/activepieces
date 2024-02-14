import { PieceCategory } from '@activepieces/shared'
import { PieceMetadataSchema } from '../../piece-metadata-entity'
import Fuse from 'fuse.js'

export const filterPiecesBasedUser = ({ searchQuery, pieces, categories }: { categories: PieceCategory[] | undefined, searchQuery: string | undefined, pieces: PieceMetadataSchema[] }): PieceMetadataSchema[] => {
    return filterBasedOnCategories({
        categories,
        pieces: filterBasedOnSearchQuery({ searchQuery, pieces }),
    })
}

const filterBasedOnSearchQuery = ({ searchQuery, pieces }: { searchQuery: string | undefined, pieces: PieceMetadataSchema[] }): PieceMetadataSchema[] => {
    if (!searchQuery) {
        return pieces
    }

    const actionsAndTrigger = pieces.flatMap(p => [...Object.values(p.actions), ...Object.values(p.triggers)])
    const convertPieces = pieces.map(p => ({
        ...p,
        actionOrTrigger: actionsAndTrigger.map(a => {
            return {
                displayName: a.displayName,
            }
        }),
    }))
    const fuse = new Fuse(convertPieces, {
        isCaseSensitive: false,
        shouldSort: true,
        keys: [{
            name: 'name',
            weight: 5,
        }, {
            name: 'description',
            weight: 5,
        }, {
            name: 'actionOrTrigger.displayName',
            weight: 1,
        }],
        threshold: 0.3,
    })

    return fuse.search(searchQuery).map(({ item }) => pieces.find(p => p.name === item.name)!)
}

const filterBasedOnCategories = ({ categories, pieces }: { categories: PieceCategory[] | undefined, pieces: PieceMetadataSchema[] }): PieceMetadataSchema[] => {
    if (!categories) {
        return pieces
    }

    return pieces.filter(p => {
        return categories.some(item => (p.categories ?? []).includes(item))
    })
}

