import { createPiece } from "@activepieces/framework";
import { getClickupTaskCommants } from "./actions/comments/get-task-comments";
import { createClickupFolderlessList } from "./actions/lists/create-folderless-list";
import { createClickupTask } from "./actions/tasks/create-task";
import { getClickupList } from "./actions/lists/get-list";
import { getClickupSpace } from "./actions/spaces/get-space";
import { getClickupSpaces } from "./actions/spaces/get-spaces";

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
