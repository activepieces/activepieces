import { createPiece, PieceAuth } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addOrUpdateSubscriber } from './lib/actions/add-or-update-subscriber'
import { createAList } from './lib/actions/create-a-list'
import { findSubscriber } from './lib/actions/find-subscriber'
import { unsubscribe } from './lib/actions/unsubscribe'
import { smooveAuth } from './lib/common/auth'
import { newFormCreated } from './lib/triggers/new-form-created'
import { newLeadSubmitted } from './lib/triggers/new-lead-submitted'
import { newListCreated } from './lib/triggers/new-list-created'
import { newSubscriber } from './lib/triggers/new-subscriber'

export const smoove = createPiece({
    displayName: 'Smoove',
    auth: smooveAuth,
    description:
        'Smoove is a platform for creating and managing your email list and sending emails to your subscribers.',
    categories: [PieceCategory.MARKETING],
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/smoove.png',
    authors: ['Sanket6652', 'onyedikachi-david'],
    actions: [addOrUpdateSubscriber, createAList, findSubscriber, unsubscribe],
    triggers: [newListCreated, newSubscriber, newFormCreated, newLeadSubmitted],
})
