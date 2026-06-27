import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createClickupTaskComment } from './lib/actions/comments/create-task-comment';
import { getClickupTaskComments } from './lib/actions/comments/get-task-comments';
import { getClickupAccessibleCustomFields } from './lib/actions/custom-fields/get-accessible-custom-fields';
import { setClickupCustomFieldValue } from './lib/actions/custom-fields/set-custom-fields-value';
import { createClickupFolderlessList } from './lib/actions/lists/create-folderless-list';
import { getClickupList } from './lib/actions/lists/get-list';
import { getClickupSpace } from './lib/actions/spaces/get-space';
import { getClickupSpaces } from './lib/actions/spaces/get-spaces';
import { createClickupSubtask } from './lib/actions/tasks/create-subtask';
import { createClickupTask } from './lib/actions/tasks/create-task';
import { createClickupTaskFromTemplate } from './lib/actions/tasks/create-task-from-template';
import { deleteClickupTask } from './lib/actions/tasks/delete-task';
import { filterClickupWorkspaceTasks } from './lib/actions/tasks/filter-workspace-tasks';
import { filterClickupWorkspaceTimeEntries } from './lib/actions/tasks/filter-workspace-time-entries';
import { getClickupTask } from './lib/actions/tasks/get-task';
import { updateClickupTask } from './lib/actions/tasks/update-task';
import { clickupTriggers as triggers } from './lib/triggers';
import { getClickupChannels } from './lib/actions/chat/get-channels';
import { getClickupChannelMessages } from './lib/actions/chat/get-channel-messages';
import { createClickupChannel } from './lib/actions/chat/create-channel';
import { createClickupChannelInSpaceFolderOrList } from './lib/actions/chat/create-channel-in-space-folder-list';
import { getClickupChannel } from './lib/actions/chat/get-channel';
import { createClickupMessage } from './lib/actions/chat/create-message';
import { createClickupMessageReply } from './lib/actions/chat/create-message-reply';
import { createClickupMessageReaction } from './lib/actions/chat/create-message-reaction';
import { getClickupMessageReactions } from './lib/actions/chat/get-message-reactions';
import { getClickupMessageReplies } from './lib/actions/chat/get-message-replies';
import { updateClickupMessage } from './lib/actions/chat/update-message';
import { deleteClickupMessage } from './lib/actions/chat/delete-message';
import { deleteClickupMessageReaction } from './lib/actions/chat/delete-message-reaction';
import { getClickupTaskByName } from './lib/actions/tasks/get-task-by-name';
import { clickupAuth } from './lib/auth';
// AI atomic actions (audience: 'ai')
import { clickupCreateChecklistItem } from './lib/actions/checklists/create-checklist-item';
import { clickupCreateChecklist } from './lib/actions/checklists/create-checklist';
import { clickupDeleteChecklistItem } from './lib/actions/checklists/delete-checklist-item';
import { clickupDeleteChecklist } from './lib/actions/checklists/delete-checklist';
import { clickupUpdateChecklistItem } from './lib/actions/checklists/update-checklist-item';
import { clickupUpdateChecklist } from './lib/actions/checklists/update-checklist';
import { clickupCreateTaskComment } from './lib/actions/comments/clickup-create-task-comment';
import { clickupDeleteComment } from './lib/actions/comments/clickup-delete-comment';
import { clickupGetTaskComments } from './lib/actions/comments/clickup-get-task-comments';
import { clickupUpdateComment } from './lib/actions/comments/clickup-update-comment';
import { clickupGetAccessibleCustomFields } from './lib/actions/custom-fields/get-accessible-custom-fields-ai';
import { clickupCreateFolder } from './lib/actions/folders/ai-create-folder';
import { clickupDeleteFolder } from './lib/actions/folders/ai-delete-folder';
import { clickupGetFolders } from './lib/actions/folders/ai-get-folders';
import { clickupGetFolder } from './lib/actions/folders/ai-get-folder';
import { clickupUpdateFolder } from './lib/actions/folders/ai-update-folder';
import { clickupCreateFolderlessList } from './lib/actions/lists/ai-create-folderless-list';
import { clickupCreateList } from './lib/actions/lists/ai-create-list';
import { clickupDeleteList } from './lib/actions/lists/ai-delete-list';
import { clickupGetFolderlessLists } from './lib/actions/lists/ai-get-folderless-lists';
import { clickupGetFolderLists } from './lib/actions/lists/ai-get-folder-lists';
import { clickupGetListMembers } from './lib/actions/lists/ai-get-list-members';
import { clickupGetList } from './lib/actions/lists/ai-get-list';
import { clickupUpdateList } from './lib/actions/lists/ai-update-list';
import { clickupListWorkspaceMembers } from './lib/actions/members/list-workspace-members';
import { clickupCreateSpace } from './lib/actions/spaces/ai-create-space';
import { clickupDeleteSpace } from './lib/actions/spaces/ai-delete-space';
import { clickupGetSpaces } from './lib/actions/spaces/ai-get-spaces';
import { clickupGetSpace } from './lib/actions/spaces/ai-get-space';
import { clickupUpdateSpace } from './lib/actions/spaces/ai-update-space';
import { clickupCreateSpaceTag } from './lib/actions/tags/create-space-tag';
import { clickupDeleteSpaceTag } from './lib/actions/tags/delete-space-tag';
import { clickupGetSpaceTags } from './lib/actions/tags/get-space-tags';
import { clickupUpdateSpaceTag } from './lib/actions/tags/update-space-tag';
import { clickupAddTagToTaskAi } from './lib/actions/tasks/clickup-add-tag-to-task';
import { clickupAddTaskDependencyAi } from './lib/actions/tasks/clickup-add-task-dependency';
import { clickupCreateTaskAi } from './lib/actions/tasks/clickup-create-task';
import { clickupDeleteTaskDependencyAi } from './lib/actions/tasks/clickup-delete-task-dependency';
import { clickupDeleteTaskAi } from './lib/actions/tasks/clickup-delete-task';
import { clickupGetBulkTasksTimeInStatusAi } from './lib/actions/tasks/clickup-get-bulk-tasks-time-in-status';
import { clickupGetTaskMembersAi } from './lib/actions/tasks/clickup-get-task-members';
import { clickupGetTaskAi } from './lib/actions/tasks/clickup-get-task';
import { clickupLinkTasksAi } from './lib/actions/tasks/clickup-link-tasks';
import { clickupListListTasksAi } from './lib/actions/tasks/clickup-list-list-tasks';
import { clickupListTasksAi } from './lib/actions/tasks/clickup-list-tasks';
import { clickupMoveTaskToListAi } from './lib/actions/tasks/clickup-move-task-to-list';
import { clickupRemoveTagFromTaskAi } from './lib/actions/tasks/clickup-remove-tag-from-task';
import { clickupRemoveTaskFromListAi } from './lib/actions/tasks/clickup-remove-task-from-list';
import { clickupSetTaskStatusAi } from './lib/actions/tasks/clickup-set-task-status';
import { clickupUnlinkTasksAi } from './lib/actions/tasks/clickup-unlink-tasks';
import { clickupUpdateTaskAi } from './lib/actions/tasks/clickup-update-task';
import { clickupCreateTimeEntry } from './lib/actions/time-tracking/create-time-entry';
import { clickupDeleteTimeEntry } from './lib/actions/time-tracking/delete-time-entry';
import { clickupGetRunningTimeEntry } from './lib/actions/time-tracking/get-running-time-entry';
import { clickupGetTimeEntry } from './lib/actions/time-tracking/get-time-entry';
import { clickupListTimeEntries } from './lib/actions/time-tracking/list-time-entries';
import { clickupStartTimeEntry } from './lib/actions/time-tracking/start-time-entry';
import { clickupStopTimeEntry } from './lib/actions/time-tracking/stop-time-entry';
import { clickupUpdateTimeEntry } from './lib/actions/time-tracking/update-time-entry';

export const clickup = createPiece({
  displayName: 'ClickUp',
  description: 'All-in-one productivity platform',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/clickup.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: clickupAuth,
  actions: [
    createClickupTask,
    createClickupTaskFromTemplate,
    createClickupFolderlessList,
    createClickupTaskComment,
    createClickupSubtask,
    createClickupChannel,
    createClickupChannelInSpaceFolderOrList,
    createClickupMessage,
    createClickupMessageReaction,
    createClickupMessageReply,
    getClickupList,
    getClickupTask,
    getClickupTaskByName,
    getClickupSpace,
    getClickupSpaces,
    getClickupTaskComments,
    getClickupChannel,
    getClickupChannels,
    getClickupChannelMessages,
    getClickupMessageReactions,
    getClickupMessageReplies,
    filterClickupWorkspaceTasks,
    filterClickupWorkspaceTimeEntries,
    updateClickupTask,
    updateClickupMessage,
    deleteClickupMessage,
    deleteClickupMessageReaction,
    deleteClickupTask,
    getClickupAccessibleCustomFields,
    setClickupCustomFieldValue,
    clickupCreateChecklistItem,
    clickupCreateChecklist,
    clickupDeleteChecklistItem,
    clickupDeleteChecklist,
    clickupUpdateChecklistItem,
    clickupUpdateChecklist,
    clickupCreateTaskComment,
    clickupDeleteComment,
    clickupGetTaskComments,
    clickupUpdateComment,
    clickupGetAccessibleCustomFields,
    clickupCreateFolder,
    clickupDeleteFolder,
    clickupGetFolders,
    clickupGetFolder,
    clickupUpdateFolder,
    clickupCreateFolderlessList,
    clickupCreateList,
    clickupDeleteList,
    clickupGetFolderlessLists,
    clickupGetFolderLists,
    clickupGetListMembers,
    clickupGetList,
    clickupUpdateList,
    clickupListWorkspaceMembers,
    clickupCreateSpace,
    clickupDeleteSpace,
    clickupGetSpaces,
    clickupGetSpace,
    clickupUpdateSpace,
    clickupCreateSpaceTag,
    clickupDeleteSpaceTag,
    clickupGetSpaceTags,
    clickupUpdateSpaceTag,
    clickupAddTagToTaskAi,
    clickupAddTaskDependencyAi,
    clickupCreateTaskAi,
    clickupDeleteTaskDependencyAi,
    clickupDeleteTaskAi,
    clickupGetBulkTasksTimeInStatusAi,
    clickupGetTaskMembersAi,
    clickupGetTaskAi,
    clickupLinkTasksAi,
    clickupListListTasksAi,
    clickupListTasksAi,
    clickupMoveTaskToListAi,
    clickupRemoveTagFromTaskAi,
    clickupRemoveTaskFromListAi,
    clickupSetTaskStatusAi,
    clickupUnlinkTasksAi,
    clickupUpdateTaskAi,
    clickupCreateTimeEntry,
    clickupDeleteTimeEntry,
    clickupGetRunningTimeEntry,
    clickupGetTimeEntry,
    clickupListTimeEntries,
    clickupStartTimeEntry,
    clickupStopTimeEntry,
    clickupUpdateTimeEntry,
    createCustomApiCallAction({
      auth: clickupAuth,
      baseUrl: () => {
        return 'https://api.clickup.com/api/v2/';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
        };
      },
    }),
  ],
  authors: ["kanarelo","kishanprmr","MoShizzle","khaledmashaly","abuaboud","AbdulTheActivePiecer"],
  triggers,
});
