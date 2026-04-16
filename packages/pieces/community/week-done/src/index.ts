import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { getCompanyInfoAction } from './lib/actions/company'
import { addItemCommentAction } from './lib/actions/items/add-item-comment'
import { addItemLikeAction } from './lib/actions/items/add-item-like'
import { assignItemAction } from './lib/actions/items/assign-item'
import { createItemAction } from './lib/actions/items/create-item'
import { deleteItemAction } from './lib/actions/items/delete-item'
import { deleteItemCommentAction } from './lib/actions/items/delete-item-comment'
import { deleteItemLikeAction } from './lib/actions/items/delete-item-like'
import { getItemCommentsAction } from './lib/actions/items/get-item-comments'
import { getItemLikesAction } from './lib/actions/items/get-item-likes'
import { searchItemsAction } from './lib/actions/items/search-items'
import { sortItemsAction } from './lib/actions/items/sort-items'
import { updateItemAction } from './lib/actions/items/update-item'
import { weekdoneAuth } from './lib/auth'

export const weekdone = createPiece({
    displayName: 'Weekdone',
    description:
        'Goal-setting and progress tracking software that helps teams align their objectives and key results (OKRs).',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/week-done.png',
    categories: [PieceCategory.PRODUCTIVITY],
    authors: ['onyedikachi-david'],
    auth: weekdoneAuth,
    actions: [
        searchItemsAction,
        createItemAction,
        updateItemAction,
        assignItemAction,
        deleteItemAction,
        getItemLikesAction,
        addItemLikeAction,
        deleteItemLikeAction,
        getItemCommentsAction,
        addItemCommentAction,
        deleteItemCommentAction,
        sortItemsAction,
        getCompanyInfoAction,
        createCustomApiCallAction({
            auth: weekdoneAuth,
            baseUrl: () => 'https://api.weekdone.com/1',
            authLocation: 'queryParams',
            authMapping: async (auth) => ({
                token: (auth as OAuth2PropertyValue).access_token,
            }),
        }),
    ],
    triggers: [],
})
