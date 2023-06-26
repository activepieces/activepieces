import { createPiece } from "@activepieces/pieces-framework";
import {
    createCompany,
    createContact,
    searchCompany,
    searchContact,
    updateCompany,
    updateContact
} from "./lib/actions";


export const mautic = createPiece({
    displayName: "Mautic",
    logoUrl: "https://cdn.activepieces.com/pieces/mautic.png",
    authors: ["bibhuty-did-this"],
    actions: [createContact,searchContact,updateContact,createCompany,searchCompany,updateCompany],
    triggers: [],
});
