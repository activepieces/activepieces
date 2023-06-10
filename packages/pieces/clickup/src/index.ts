import { createPiece } from "@activepieces/pieces-framework";
import { getClickupTaskComments } from "./lib/actions/comments/get-task-comments";
import { createClickupFolderlessList } from "./lib/actions/lists/create-folderless-list";
import { createClickupTask } from "./lib/actions/tasks/create-task";
import { getClickupList } from "./lib/actions/lists/get-list";
import { getClickupSpace } from "./lib/actions/spaces/get-space";
import { getClickupSpaces } from "./lib/actions/spaces/get-spaces";
import { createClickupTaskComment } from "./lib/actions/comments/create-task-comment";
import { createClickupSubtask } from "./lib/actions/tasks/create-subtask";
import { clickupTriggers as triggers } from "./lib/triggers";

export const clickup = createPiece({
    displayName: "Clickup",
    logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
    actions: [
        createClickupTask,
        createClickupFolderlessList,
        getClickupList,
        getClickupSpace,
        getClickupSpaces,
        getClickupTaskComments,
        createClickupTaskComment,
        createClickupSubtask,
    ],
    authors: ['abuaboud', 'ShayPunter', 'kanarelo'],
    triggers
});
