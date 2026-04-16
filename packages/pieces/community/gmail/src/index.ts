import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { gmailCreateDraftReplyAction } from './lib/actions/create-draft-reply-action'
import { gmailGetEmailAction } from './lib/actions/get-mail-action'
import { gmailReplyToEmailAction } from './lib/actions/reply-to-email-action'
import { requestApprovalInEmail } from './lib/actions/request-approval-in-email'
import { gmailSearchMailAction } from './lib/actions/search-email-action'
import { gmailSendEmailAction } from './lib/actions/send-email-action'
import { GmailAuthValue, getAccessToken, gmailAuth } from './lib/auth'
import { gmailNewAttachmentTrigger } from './lib/triggers/new-attachment'
import { gmailNewEmailTrigger } from './lib/triggers/new-email'
import { gmailNewLabelTrigger } from './lib/triggers/new-label'
import { gmailNewLabeledEmailTrigger } from './lib/triggers/new-labeled-email'

export {
    createGoogleClient,
    GmailAuthValue,
    getAccessToken,
    gmailAuth,
} from './lib/auth'

export const gmail = createPiece({
    minimumSupportedRelease: '0.30.0',
    logoUrl: 'https://cdn.activepieces.com/pieces/gmail.png',
    categories: [PieceCategory.COMMUNICATION, PieceCategory.BUSINESS_INTELLIGENCE],
    actions: [
        gmailSendEmailAction,
        requestApprovalInEmail,
        gmailReplyToEmailAction,
        gmailCreateDraftReplyAction,
        gmailGetEmailAction,
        gmailSearchMailAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://gmail.googleapis.com/gmail/v1',
            auth: gmailAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${await getAccessToken(auth as GmailAuthValue)}`,
            }),
        }),
    ],
    displayName: 'Gmail',
    description: 'Email service by Google',

    authors: [
        'kanarelo',
        'abdullahranginwala',
        'BastienMe',
        'Salem-Alaa',
        'kishanprmr',
        'MoShizzle',
        'AbdulTheActivePiecer',
        'khaledmashaly',
        'abuaboud',
        'AdamSelene',
        'sanket-a11y',
        'onyedikachi-david',
    ],
    triggers: [gmailNewEmailTrigger, gmailNewLabeledEmailTrigger, gmailNewAttachmentTrigger, gmailNewLabelTrigger],
    auth: gmailAuth,
})
