import packageJson from "../package.json";
import { createPiece } from "@activepieces/framework";
import { blackbaudCreateContacts } from "./lib/actions/create-contacts";
import { blackbaudListContacts } from "./lib/actions/list-contacts";

export const blackbaud = createPiece({
    name: 'blackbaud',
    displayName: "Blackbaud",
    logoUrl: 'https://cdn.activepieces.com/pieces/blackbaud.png',
    version: packageJson.version,
    authors: ['abuaboud'],
    actions: [blackbaudCreateContacts, blackbaudListContacts],
    triggers: [],
});
