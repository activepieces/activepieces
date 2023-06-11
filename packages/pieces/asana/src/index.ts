import { createPiece } from "@activepieces/pieces-framework";
import { createAsanaTask } from "./lib/actions/create-task";

export const asana = createPiece({
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    authors: ['abuaboud'],
    actions: [createAsanaTask],
    triggers: [],
});
