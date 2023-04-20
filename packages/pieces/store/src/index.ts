import packageJson from "../package.json";
import { createPiece } from "@activepieces/pieces-framework";
import { storageGetAction } from "./lib/actions/store-get-action";
import { storagePutAction } from "./lib/actions/store-put-action";
import { storageRemoveValue } from "./lib/actions/store-remove-value";
import { storageAddtoList } from "./lib/actions/store-add-to-list";
import { storageRemoveFromList } from "./lib/actions/store-remove-from-list";

export const storage = createPiece({
    name: 'store',
    displayName: 'Storage',
    description: "Store or retrieve data from activepieces key/value database",
    logoUrl: 'https://cdn.activepieces.com/pieces/store.png',
    version: packageJson.version,
    minimumSupportedRelease: '0.3.11',
    actions: [storageGetAction, storagePutAction, storageRemoveValue, storageAddtoList, storageRemoveFromList],
    triggers: [],
});
