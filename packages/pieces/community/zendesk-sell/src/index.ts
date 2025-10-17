import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { zendeskSellAuth } from "./lib/common/auth";

import { createContact } from "./lib/actions/create-contact";
import { createDeal } from "./lib/actions/create-deal";
import { createLead } from "./lib/actions/create-lead";
import { createNote } from "./lib/actions/create-note";
import { createTask } from "./lib/actions/create-task";
import { findCompany } from "./lib/actions/find-company";
import { findContact } from "./lib/actions/find-contact";
import { findDeal } from "./lib/actions/find-deal";
import { findLead } from "./lib/actions/find-lead";
import { findUser } from "./lib/actions/find-user";
import { updateContact } from "./lib/actions/update-contact";
import { updateDeal } from "./lib/actions/update-deal";

import { newContact } from "./lib/triggers/new-contact";
import { newDeal } from "./lib/triggers/new-deal";
import { newLead } from "./lib/triggers/new-lead";
import { updatedLead } from "./lib/triggers/updated-lead";
import { updatedContact } from "./lib/triggers/updated-contact";
import { dealEntersNewStage } from "./lib/triggers/deal-enters-new-stage";
import { newNote } from "./lib/triggers/new-note"; 

export const zendeskSell = createPiece({
    displayName: "Zendesk Sell",
    description: "Sales CRM software to enhance productivity, processes, and pipeline visibility.",
    auth: zendeskSellAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/zendesk-sell.png",
    categories: [PieceCategory.SALES_AND_CRM],
    authors: [
        "david-oluwaseun420"
    ],
    actions: [
        createContact,
        createDeal,
        createLead,
        createNote,
        createTask,
        findCompany,
        findContact,
        findDeal,
        findLead,
        findUser,
        updateContact,
        updateDeal,
    ],
    triggers: [
        newContact,
        newDeal,
        newLead,
        newNote, 
        updatedContact,
        updatedLead,
        dealEntersNewStage,
    ],
});