import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { Buffer } from 'buffer'; 

// Auth
import { zendeskSellAuth, ZendeskSellAuth } from "./lib/common/auth";
import { ZENDESK_SELL_API_URL } from "./lib/common/client";

// Actions
import { createContact } from "./lib/actions/create_contact";
import { createLead } from "./lib/actions/create_lead";
import { createDeal } from "./lib/actions/create_deal";
import { createNote } from "./lib/actions/create_note";
import { updateContact } from "./lib/actions/update_contact";
import { updateDeal } from "./lib/actions/update_deal";
import { findDeal } from "./lib/actions/find_deal";
import { findContact } from "./lib/actions/find_contact";
import { findLead } from "./lib/actions/find_lead";
import { findCompany } from "./lib/actions/find_company";
import { findUser } from "./lib/actions/find_user";

// Triggers
import { newContact } from "./lib/triggers/new_contact";
import { newLead } from "./lib/triggers/new_lead";
import { newDeal } from "./lib/triggers/new_deal";
import { updatedLead } from "./lib/triggers/updated_lead";
import { updatedContact } from "./lib/triggers/updated_contact";
import { updatedDeal } from "./lib/triggers/updated_deal";
import { dealEntersStage } from "./lib/triggers/deal_enters_stage";
import { newNote } from "./lib/triggers/new_note";

export const zendeskSell = createPiece({
  displayName: "Zendesk-sell",
  description: "Sales CRM for pipeline management, lead tracking, and contact organization.",
  auth: zendeskSellAuth,
  minimumSupportedRelease: '0.3.61',
  logoUrl: "https://cdn.activepieces.com/pieces/zendesk-sell.png",
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
            const { email, api_token } = auth.props;
            const credentials = `${email}/token:${api_token}`;
            const encodedCredentials = Buffer.from(credentials).toString('base64');
            return {
                Authorization: `Basic ${encodedCredentials}`,
            };
        }
    })
  ],
  triggers: [
    newContact,
    newLead,
    newDeal,
    updatedLead,
    updatedContact,
    updatedDeal,
    dealEntersStage,
    newNote
  ],
});