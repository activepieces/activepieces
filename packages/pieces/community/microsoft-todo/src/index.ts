import { createPiece, OAuth2PropertyValue, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';


import { createTask } from './lib/actions/create-task';
import { createTaskListAction } from './lib/actions/create-task-list';
import { updateTaskListAction } from './lib/actions/update-task-list';
import { updateTaskAction } from './lib/actions/update-task';
import { completeTaskAction } from './lib/actions/complete-task';
import { addAttachmentAction } from './lib/actions/add-attachment';
import { getTaskAction } from './lib/actions/get-task';
import { deleteTaskAction } from './lib/actions/delete-task';
import { findTaskListByNameAction } from './lib/actions/find-task-list-by-name';
import { findTaskByTitleAction } from './lib/actions/find-task-by-title';


import { newTaskCreatedTrigger } from './lib/triggers/new-task-created';
import { newOrUpdatedTaskTrigger } from './lib/triggers/task-updated';
import { newListCreatedTrigger } from './lib/triggers/new-list-created';
import { taskCompletedTrigger } from './lib/triggers/task-completed';


const authDesc = `
1. Sign in to [Microsoft Azure Portal](https://portal.azure.com/).
2. From the left sidebar, go to **Microsoft Enfra ID**.
3. Under **Manage**, click on **App registrations**.
4. Click the **New registration** button.
5. Enter a **Name** for your app.
6. For **Supported account types**, choose:
   - **Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts**
   - Or select based on your requirement.
7. In **Redirect URI**, select **Web** and add the given URL.
8. Click **Register**.
9. After registration, you’ll be redirected to the app’s overview page. Copy the **Application (client) ID**.
10. From the left menu, go to **Certificates & secrets**.
    - Under **Client secrets**, click **New client secret**.
    - Provide a description, set an expiry, and click **Add**.
    - Copy the **Value** of the client secret (this will not be shown again).
11. Go to **API permissions** from the left menu.
    - Click **Add a permission**.
    - Select **Microsoft Graph** → **Delegated permissions**.
    - Add the following scopes:
      - User.Read
      - Tasks.ReadWrite
      - offline_access
    - Click **Add permissions**.
12. Copy your **Client ID** and **Client Secret**.
`;

export const microsoftToDoAuth = PieceAuth.OAuth2({
    description: authDesc,
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    required: true,
    scope: ['Tasks.ReadWrite', 'User.Read', 'offline_access'],
    prompt: 'omit'
});

export const microsoftTodo = createPiece({
    displayName: 'Microsoft To Do',
    description: 'Cloud based task management application.',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: microsoftToDoAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-todo.png',
    authors: ['onyedikachi-david','david-oluwaseun420'],
    actions: [
        createTask,
        createTaskListAction,
        updateTaskAction,
        updateTaskListAction,
        completeTaskAction,
        deleteTaskAction,
        addAttachmentAction,
        getTaskAction,
        findTaskListByNameAction,
        findTaskByTitleAction,
        createCustomApiCallAction({
            baseUrl: () => 'https://graph.microsoft.com/v1.0/me/todo',
            auth: microsoftToDoAuth,
            authMapping: async (auth) => ({
                Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            }),
        }),
    ],
    triggers: [
        newTaskCreatedTrigger,
        newOrUpdatedTaskTrigger,
        newListCreatedTrigger,
        taskCompletedTrigger,
    ],
});