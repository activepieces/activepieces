import { createPiece } from "@activepieces/pieces-framework";
import { deleteContact } from './lib/actions/delete-contact';
import { addOrUpdateContact } from './lib/actions/add-or-update-contact';
import { createEvent } from "./lib/actions/create-event";
import { PieceCategory } from '@activepieces/pieces-framework';
import { instasentAuth } from './lib/auth';

export const instasent = createPiece({
    displayName: "Instasent",
    minimumSupportedRelease: '0.88.2',
    logoUrl: "https://cdn.activepieces.com/pieces/instasent.jpg",
    categories:[PieceCategory.MARKETING],
    authors: ["dev-instasent", "https://github.com/dev-instasent"],
    auth: instasentAuth,
    actions: [addOrUpdateContact, deleteContact, createEvent],
    triggers: [],
});
