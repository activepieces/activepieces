import { createPiece } from "@activepieces/framework";
import { createClickupList } from "./actions/create-list";
import { createClickupTask } from "./actions/create-task";

export const clickup = createPiece({
    name: 'clickup',
    displayName: "Clickup",
    logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
    actions: [
        createClickupTask,
        createClickupList,
    ],
    triggers: [],
});
