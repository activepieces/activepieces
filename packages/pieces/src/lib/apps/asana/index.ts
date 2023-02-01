import { createPiece } from "../../framework/piece";
import { createAsanaTask } from "./actions/create-task";

export const asana = createPiece({
    name: 'asana',
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    actions: [createAsanaTask],
    triggers: [],
});