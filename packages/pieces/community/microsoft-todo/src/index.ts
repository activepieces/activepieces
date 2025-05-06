import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createTask } from "./lib/actions/create-task";
import { createTaskListAction } from "./lib/actions/create-task-list";
import { updateTaskAction } from "./lib/actions/update-task";
import { findTaskListByNameAction } from "./lib/actions/find-task-list-by-name";
import { findTaskByTitleAction } from "./lib/actions/find-task-by-title";
import { newTaskCreatedTrigger } from "./lib/triggers/new-task-created";
import { taskCompletedTrigger } from "./lib/triggers/task-completed";
import { taskUpdatedTrigger } from "./lib/triggers/task-updated";

// Export auth for use in triggers
export const microsoftToDoAuth = PieceAuth.OAuth2({
  description: "Authenticate with your Microsoft Account. You will need to register an application in the Microsoft Entra admin center. For the Redirect URI, please use: `https://cloud.activepieces.com/redirect` (or your self-hosted instance redirect URI)",
  authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  required: true,
  scope: ['Tasks.ReadWrite', 'User.Read', 'offline_access'],
});

export const microsoftTodo = createPiece({
  displayName: "Microsoft To Do",
  auth: microsoftToDoAuth, // Use the exported and consistently named auth object
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/microsoft-todo.png",
  authors: ["Activepieces Community"],
  actions: [
    createTask,
    createTaskListAction,
    updateTaskAction,
    findTaskListByNameAction,
    findTaskByTitleAction
  ],
  triggers: [
    newTaskCreatedTrigger,
    taskCompletedTrigger,
    taskUpdatedTrigger
  ],
});
