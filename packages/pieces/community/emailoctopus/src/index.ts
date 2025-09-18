import { createPiece } from "@activepieces/pieces-framework";
import { emailOctopusAuth } from "./lib/common/auth";


import { addOrUpdateContact } from "./lib/actions/add-or-update-contact";
import { unsubscribeContact } from "./lib/actions/unsubscribe-contact";
import { updateContactEmail } from "./lib/actions/update-contact-email";
import { addTagToContact } from "./lib/actions/add-tag-to-contact";
import { removeTagFromContact } from "./lib/actions/remove-tag-from-contact";
import { createList } from "./lib/actions/create-list";
import { findContact } from "./lib/actions/find-contact"; 


import { emailBounced } from "./lib/triggers/email-bounced";
import { emailOpened } from "./lib/triggers/email-opened"; 
import { emailClicked } from "./lib/triggers/email-Clicked";
import { newContact } from "./lib/triggers/new-Contact";
import { contactUnsubscribes } from "./lib/triggers/contact-Unsubscribes";

export const emailoctopus = createPiece({
    displayName: "EmailOctopus",
    auth: emailOctopusAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/emailoctopus.png",
    authors: [
    ],
    actions: [
        addOrUpdateContact,
        unsubscribeContact,
        updateContactEmail,
        addTagToContact,
        removeTagFromContact,
        createList,
        findContact 
    ],
    triggers: [
      emailBounced,
      emailOpened,
      emailClicked,
      newContact,
      contactUnsubscribes
    ],
});