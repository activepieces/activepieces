import packageJson from "../package.json";
import { createPiece } from "@activepieces/framework";
import { blackbaudCreateContacts } from "./lib/actions/create-contacts-batch";
import { blackbaudSearchAfterDate } from "./lib/actions/search-contacts-after-date";
import { blackbaudCreateContactOnEmail } from "./lib/actions/create-contact";
import { blackbaudUpdateContact } from "./lib/actions/update-contact";

export const blackbaud = createPiece({
    name: 'blackbaud',
    displayName: "Blackbaud",
    logoUrl: 'https://cdn.activepieces.com/pieces/blackbaud.png',
    version: packageJson.version,
    authors: ['abuaboud'],
    actions: [blackbaudCreateContacts, blackbaudSearchAfterDate, blackbaudCreateContactOnEmail, blackbaudUpdateContact],
    triggers: [],
});
