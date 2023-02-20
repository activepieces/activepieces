import { createPiece } from "@activepieces/framework";
import { createAsanaTask } from "./actions/create-task";

export const asana = createPiece({
    name: 'asana',
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    authors: ['abuaboud'],
    actions: [createAsanaTask],
    triggers: [],
});
