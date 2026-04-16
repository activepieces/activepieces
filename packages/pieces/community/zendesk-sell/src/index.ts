import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { Buffer } from 'buffer'
// Actions
import { createContact } from './lib/actions/create_contact'
import { createDeal } from './lib/actions/create_deal'
import { createLead } from './lib/actions/create_lead'
import { createNote } from './lib/actions/create_note'
import { findCompany } from './lib/actions/find_company'
import { findContact } from './lib/actions/find_contact'
import { findDeal } from './lib/actions/find_deal'
import { findLead } from './lib/actions/find_lead'
import { findUser } from './lib/actions/find_user'
import { updateContact } from './lib/actions/update_contact'
import { updateDeal } from './lib/actions/update_deal'
// Auth
import { ZendeskSellAuth, zendeskSellAuth } from './lib/common/auth'
import { ZENDESK_SELL_API_URL } from './lib/common/client'
import { dealEntersStage } from './lib/triggers/deal_enters_stage'
// Triggers
import { newContact } from './lib/triggers/new_contact'
import { newDeal } from './lib/triggers/new_deal'
import { newLead } from './lib/triggers/new_lead'
import { newNote } from './lib/triggers/new_note'
import { updatedContact } from './lib/triggers/updated_contact'
import { updatedDeal } from './lib/triggers/updated_deal'
import { updatedLead } from './lib/triggers/updated_lead'

export const zendeskSell = createPiece({
    displayName: 'Zendesk-sell',
    description: 'Sales CRM for pipeline management, lead tracking, and contact organization.',
    auth: zendeskSellAuth,
    minimumSupportedRelease: '0.3.61',
    logoUrl: 'https://cdn.activepieces.com/pieces/zendesk-sell.png',
    authors: ['Pranith124', 'onyedikachi-david'],
    categories: [PieceCategory.SALES_AND_CRM],
    actions: [
        createContact,
        createLead,
        createDeal,
        updateContact,
        updateDeal,
        createNote,
        findDeal,
        findContact,
        findLead,
        findCompany,
        findUser,
        createCustomApiCallAction({
            auth: zendeskSellAuth,
            baseUrl: () => ZENDESK_SELL_API_URL,
            authMapping: async (auth) => {
                const { email, api_token } = auth.props
                const credentials = `${email}/token:${api_token}`
                const encodedCredentials = Buffer.from(credentials).toString('base64')
                return {
                    Authorization: `Basic ${encodedCredentials}`,
                }
            },
        }),
    ],
    triggers: [newContact, newLead, newDeal, updatedLead, updatedContact, updatedDeal, dealEntersStage, newNote],
})
