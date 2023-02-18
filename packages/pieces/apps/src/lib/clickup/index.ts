import { createPiece } from "@activepieces/framework";
import { createClickupList } from "./actions/create-list";
import { createClickupTask } from "./actions/create-task";
import { getClickupList } from "./actions/get-list";

export const clickup = createPiece({
    name: 'clickup',
    displayName: "Clickup",
    logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
    actions: [
        createClickupTask,
        createClickupList,
        getClickupList,
    ],
    triggers: [],
});
