import packageJson from "../package.json";
import { createPiece } from "@activepieces/framework";
import { storageGetAction } from "./lib/actions/store-get-action";
import { storagePutAction } from "./lib/actions/store-put-action";

export const storage = createPiece({
    name: 'storage',
    displayName: 'Storage',
    description: "Store or retrieve data from activepieces key/value database",
    logoUrl: 'https://cdn.activepieces.com/pieces/storage.png',
    version: packageJson.version,
    actions: [storageGetAction, storagePutAction],
    triggers: [],
});
