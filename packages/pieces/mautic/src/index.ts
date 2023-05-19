
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { createContact } from "./lib/actions/create-contact";
import { searchContact } from "./lib/actions/search-contact";
import { updateContact } from "./lib/actions/update-contact";

export const mautic = createPiece({
    name: "mautic",
    displayName: "Mautic",
    logoUrl: "https://cdn.activepieces.com/pieces/mautic.png",
    version: packageJson.version,
    authors: ["bibhuty-did-this"],
    actions: [createContact,searchContact,updateContact],
    triggers: [],
});
