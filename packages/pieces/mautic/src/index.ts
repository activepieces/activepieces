import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import {
    createCompany,
    createContact,
    searchCompany,
    searchContact,
    updateCompany,
    updateContact
} from "./lib/actions";


export const mautic = createPiece({
    name: "mautic",
    displayName: "Mautic",
    logoUrl: "https://cdn.activepieces.com/pieces/mautic.png",
    version: packageJson.version,
    authors: ["bibhuty-did-this"],
    actions: [createContact,searchContact,updateContact,createCompany,searchCompany,updateCompany],
    triggers: [],
});
