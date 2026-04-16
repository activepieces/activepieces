import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { createSubscriber } from './lib/actions/create-subscriber'
import { customApiCall } from './lib/actions/custom-api-call'
import { listSubscribers } from './lib/actions/list-subscribers'
import { sendEmail } from './lib/actions/send-email'
import { buttondownAuth } from './lib/common/auth'
import { buttondownEmailSent } from './lib/triggers/email-sent'
import { buttondownNewSubscriber } from './lib/triggers/new-subscriber'
import { buttondownSubscriberConfirmed } from './lib/triggers/subscriber-confirmed'

export const buttondown = createPiece({
    displayName: 'Buttondown',
    description: 'Automate your Buttondown newsletter workflows.',
    auth: buttondownAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/buttondown.png',
    authors: ['jacksbox-cassandra'],
    categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
    actions: [createSubscriber, listSubscribers, sendEmail, customApiCall],
    triggers: [buttondownNewSubscriber, buttondownSubscriberConfirmed, buttondownEmailSent],
})
