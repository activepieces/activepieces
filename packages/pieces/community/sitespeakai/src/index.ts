import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createFinetune } from './lib/actions/create-finetune'
import { deleteFinetune } from './lib/actions/delete-finetune'
import { sendQuery } from './lib/actions/send-query'
import { SiteSpeakAuth } from './lib/common/auth'
import { newLead } from './lib/triggers/new-lead'

export const sitespeakai = createPiece({
    displayName: 'SiteSpeakAI',
    description:
        'Integrate with Sitespeakai to leverage AI-powered chatbots and enhance user interactions on your website.',
    auth: SiteSpeakAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/sitespeakai.png',
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['Niket2035'],
    actions: [sendQuery, createFinetune, deleteFinetune],
    triggers: [newLead],
})
