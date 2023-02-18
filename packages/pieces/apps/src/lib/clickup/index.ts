import { createPiece } from "@activepieces/framework";
import { getClickupTaskCommants } from "./actions/comments/get-task-comments";
import { createClickupFolderlessList } from "./actions/create-folderless-list";
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
        createClickupFolderlessList,
        getClickupList,
        getClickupSpace,
        getClickupSpaces,
        getClickupTaskCommants,
    ],
    triggers: [],
});
