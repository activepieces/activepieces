import { createPiece } from "@activepieces/framework";
import { createAsanaTask } from "./lib/actions/create-task";

export const asana = createPiece({
    name: 'asana',
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    version: '0.0.0',
    authors: ['abuaboud'],
    actions: [createAsanaTask],
    triggers: [],
});
