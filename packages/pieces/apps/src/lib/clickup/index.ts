import { createPiece } from "@activepieces/framework";
import { createClickupList } from "./actions/create-list";
import { createClickupTask } from "./actions/create-task";
import { getClickupList } from "./actions/get-list";
import { getClickupSpace } from "./actions/get-space";
import { getClickupSpaces } from "./actions/get-spaces";

export const clickup = createPiece({
    name: 'clickup',
    displayName: "Clickup",
    logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
    actions: [
        createClickupTask,
        createClickupList,
        getClickupList,
        getClickupSpace,
        getClickupSpaces,
    ],
    triggers: [],
});
