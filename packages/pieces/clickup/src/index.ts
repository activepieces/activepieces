import { createPiece } from "@activepieces/framework";
import { getClickupTaskCommants } from "./lib/actions/comments/get-task-comments";
import { createClickupFolderlessList } from "./lib/actions/lists/create-folderless-list";
import { createClickupTask } from "./lib/actions/tasks/create-task";
import { getClickupList } from "./lib/actions/lists/get-list";
import { getClickupSpace } from "./lib/actions/spaces/get-space";
import { getClickupSpaces } from "./lib/actions/spaces/get-spaces";
import { createClickupTaskComment } from "./lib/actions/comments/create-task-comment";
import { createClickupSubtask } from "./lib/actions/tasks/create-subtask";

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
        createClickupTaskComment,
        createClickupSubtask,
    ],
    authors: ['abuaboud', 'ShayPunter'],
    triggers: [],
    version: '0.0.0',
});
