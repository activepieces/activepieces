import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece, Piece, PieceAuth, PiecePropValueSchema, Property } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createPageFromTemplateAction } from './lib/actions/create-page-from-template'
import { getPageContent } from './lib/actions/get-page-content'
import { confluenceAuth } from './lib/auth'
import { newPageTrigger } from './lib/triggers/new-page'

export const confluence = createPiece({
    displayName: 'Confluence',
    auth: confluenceAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/confluence.png',
    authors: ['geekyme'],
    actions: [
        getPageContent,
        createPageFromTemplateAction,
        createCustomApiCallAction({
            baseUrl: (auth) => {
                return `${auth?.props.confluenceDomain ?? ''}/wiki/api/v2`
            },
            auth: confluenceAuth,
            authMapping: async (auth) => {
                const authValue = auth.props
                return {
                    Authorization: `Basic ${Buffer.from(`${authValue.username}:${authValue.password}`).toString('base64')}`,
                }
            },
        }),
    ],
    categories: [PieceCategory.CONTENT_AND_FILES],
    triggers: [newPageTrigger],
})
