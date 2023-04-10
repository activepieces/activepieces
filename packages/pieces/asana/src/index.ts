import packageJson from "../package.json";
import { createPiece } from "@activepieces/pieces-framework";
import { createAsanaTask } from "./lib/actions/create-task";

export const asana = createPiece({
    name: 'asana',
    displayName: "Asana",
    logoUrl: 'https://cdn.activepieces.com/pieces/asana.png',
    version: packageJson.version,
    authors: ['abuaboud'],
    actions: [createAsanaTask],
    triggers: [],
});
