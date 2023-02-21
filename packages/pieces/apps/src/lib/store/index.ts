import { createPiece } from "@activepieces/framework";
import { storageGetAction } from "./actions/store-get-action";
import { storagePutAction } from "./actions/store-put-action";

export const storage = createPiece({
    name: 'storage',
    displayName: 'Storage',
    description: "Store or retrieve data from activepieces key/value database",
    logoUrl: 'https://cdn.activepieces.com/pieces/storage.png',
    version: '0.0.0',
    actions: [storageGetAction, storagePutAction],
    triggers: [],
});
