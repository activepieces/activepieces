import crypto from 'node:crypto'
import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { OAuth2PropertyValue, PieceAuth, Property, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { addNoteToConversationAction } from './lib/actions/add-note-to-conversation'
import { addNoteToUserAction } from './lib/actions/add-note-to-user'
import { addOrRemoveTagOnCompanyAction } from './lib/actions/add-remove-tag-on-company'
import { addOrRemoveTagOnContactAction } from './lib/actions/add-remove-tag-on-contact'
import { addOrRemoveTagOnConversationAction } from './lib/actions/add-remove-tag-on-conversation'
import { createArticleAction } from './lib/actions/create-article'
import { createConversationAction } from './lib/actions/create-conversation'
import { createTicketAction } from './lib/actions/create-ticket'
import { createOrUpdateLeadAction } from './lib/actions/create-update-lead'
import { createOrUpdateUserAction } from './lib/actions/create-update-user'
import { createUserAction } from './lib/actions/create-user'
import { findCompanyAction } from './lib/actions/find-company'
import { findConversationAction } from './lib/actions/find-conversation'
import { findLeadAction } from './lib/actions/find-lead'
import { findUserAction } from './lib/actions/find-user'
import { getConversationAction } from './lib/actions/get-conversation'
import { listAllTagsAction } from './lib/actions/list-all-tags'
import { replyToConversation } from './lib/actions/reply-to-conversation'
import { sendMessageAction } from './lib/actions/send-message.action'
import { updateTicketAction } from './lib/actions/update-ticket'
import { contactRepliedTrigger } from './lib/triggers/contact-replied'
import { contactUpdatedTrigger } from './lib/triggers/contact-updated'
import { conversationAssigned } from './lib/triggers/conversation-assigned'
import { conversationClosedTrigger } from './lib/triggers/conversation-closed'
import { conversationPartTagged } from './lib/triggers/conversation-part-tagged'
import { conversationRated } from './lib/triggers/conversation-rated'
import { conversationSnoozed } from './lib/triggers/conversation-snoozed'
import { conversationUnsnoozed } from './lib/triggers/conversation-unsnoozed'
import { leadAddedEmailTrigger } from './lib/triggers/lead-added-email'
import { leadConvertedToUserTrigger } from './lib/triggers/lead-converted-to-user'
import { newCompanyTrigger } from './lib/triggers/new-company'
import { newConversationFromUser } from './lib/triggers/new-conversation-from-user'
import { newLeadTrigger } from './lib/triggers/new-lead'
import { newTicketTrigger } from './lib/triggers/new-ticket'
import { newUserTrigger } from './lib/triggers/new-user'
import { noteAddedToConversation } from './lib/triggers/note-added-to-conversation'
import { replyFromAdmin } from './lib/triggers/reply-from-admin'
import { replyFromUser } from './lib/triggers/reply-from-user'
import { tagAddedToLeadTrigger } from './lib/triggers/tag-added-to-lead'
import { tagAddedToUserTrigger } from './lib/triggers/tag-added-to-user'

const description = `
Please follow the instructions to create Intercom Oauth2 app.

1.Log in to your Intercom account and navigate to **Settings > Integrations > Developer Hub**.
2.Click on **Create a new app** and select the appropriate workspace.
3.In **Authentication** section, add Redirect URL.
4.In **Webhooks** section, select the events you want to receive.
5.Go to the **Basic Information** section and copy the Client ID and Client Secret.
`

export const intercomAuth = PieceAuth.OAuth2({
  authUrl: 'https://app.{region}.com/oauth',
  tokenUrl: 'https://api.{region}.io/auth/eagle/token',
  required: true,
  description,
  scope: [],
  props: {
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: [
          { label: 'US', value: 'intercom' },
          { label: 'EU', value: 'eu.intercom' },
          { label: 'AU', value: 'au.intercom' },
        ],
      },
    }),
  },
})

export const intercom = createPiece({
  displayName: 'Intercom',
  description: 'Customer messaging platform for sales, marketing, and support',
  minimumSupportedRelease: '0.29.0', // introduction of new intercom APP_WEBHOOK
  logoUrl: 'https://cdn.activepieces.com/pieces/intercom.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: intercomAuth,
  authors: ['kishanprmr', 'MoShizzle', 'AbdulTheActivePiecer', 'khaledmashaly', 'abuaboud', 'AdamSelene'],
  actions: [
    addNoteToUserAction,
    addNoteToConversationAction,
    addOrRemoveTagOnContactAction,
    addOrRemoveTagOnCompanyAction,
    addOrRemoveTagOnConversationAction,
    createArticleAction,
    createConversationAction,
    createTicketAction,
    createUserAction,
    createOrUpdateLeadAction,
    createOrUpdateUserAction,
    replyToConversation,
    sendMessageAction,
    updateTicketAction,
    findCompanyAction,
    findConversationAction,
    findLeadAction,
    findUserAction,
    listAllTagsAction,
    getConversationAction,
    createCustomApiCallAction({
      baseUrl: (auth) => `https://api.${(auth as OAuth2PropertyValue).props?.['region']}.io`,
      auth: intercomAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [
    contactRepliedTrigger,
    leadAddedEmailTrigger,
    leadConvertedToUserTrigger,
    conversationClosedTrigger,
    conversationAssigned,
    conversationSnoozed,
    conversationUnsnoozed,
    newCompanyTrigger,
    newConversationFromUser,
    conversationRated,
    newLeadTrigger,
    newTicketTrigger,
    newUserTrigger,
    conversationPartTagged,
    tagAddedToLeadTrigger,
    tagAddedToUserTrigger,
    contactUpdatedTrigger,
    replyFromUser,
    replyFromAdmin,
    noteAddedToConversation,
  ],
  events: {
    parseAndReply: ({ payload }) => {
      const payloadBody = payload.body as PayloadBody
      return {
        event: payloadBody.topic,
        identifierValue: payloadBody.app_id,
      }
    },
    verify: ({ payload, webhookSecret }) => {
      const signature = payload.headers['x-hub-signature']
      let hmac: crypto.Hmac
      if (typeof webhookSecret === 'string') {
        hmac = crypto.createHmac('sha1', webhookSecret)
      } else {
        const app_id = (payload.body as PayloadBody).app_id
        const webhookSecrets = webhookSecret as Record<string, string>
        if (!(app_id in webhookSecrets)) {
          return false
        }
        hmac = crypto.createHmac('sha1', webhookSecrets[app_id])
      }
      hmac.update(`${payload.rawBody}`)
      const computedSignature = `sha1=${hmac.digest('hex')}`
      return signature === computedSignature
    },
  },
})

type PayloadBody = {
  type: string
  topic: string
  id: string
  app_id: string
}
