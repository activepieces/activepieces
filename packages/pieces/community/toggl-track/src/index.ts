import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { togglTrackAuth } from './lib/auth';
import { togglApi } from './lib/common/client';
import { createClient } from './lib/actions/create-client';
import { createProject } from './lib/actions/create-project';
import { createTask } from './lib/actions/create-task';
import { createTag } from './lib/actions/create-tag';
import { createTimeEntry } from './lib/actions/create-time-entry';
import { startTimeEntry } from './lib/actions/start-time-entry';
import { stopTimeEntry } from './lib/actions/stop-time-entry';
import { findUser } from './lib/actions/find-user';
import { findProject } from './lib/actions/find-project';
import { findTask } from './lib/actions/find-task';
import { findClient } from './lib/actions/find-client';
import { findTag } from './lib/actions/find-tag';
import { findTimeEntry } from './lib/actions/find-time-entry';
import { getClient } from './lib/actions/get-client';
import { updateClient } from './lib/actions/update-client';
import { deleteClient } from './lib/actions/delete-client';
import { getProject } from './lib/actions/get-project';
import { updateProject } from './lib/actions/update-project';
import { updateTag } from './lib/actions/update-tag';
import { deleteTag } from './lib/actions/delete-tag';
import { getTimeEntry } from './lib/actions/get-time-entry';
import { getCurrentTimeEntry } from './lib/actions/get-current-time-entry';
import { updateTimeEntry } from './lib/actions/update-time-entry';
import { deleteTimeEntry } from './lib/actions/delete-time-entry';
import { searchDetailedReport } from './lib/actions/search-detailed-report';
import { listWorkspaces } from './lib/actions/list-workspaces';
import { getWorkspace } from './lib/actions/get-workspace';
import { listOrganizationUsers } from './lib/actions/list-organization-users';
import { inviteUser } from './lib/actions/invite-user';
import { addUserToProject } from './lib/actions/add-user-to-project';
import { createGroup } from './lib/actions/create-group';
import { deleteGroup } from './lib/actions/delete-group';
import { logTimeAi } from './lib/actions/log-time-ai';
import { startTimerAi } from './lib/actions/start-timer-ai';
import { timeSummaryAi } from './lib/actions/time-summary-ai';
import { newClient } from './lib/triggers/new-client';
import { newWorkspace } from './lib/triggers/new-workspace';
import { newProject } from './lib/triggers/new-project';
import { newTask } from './lib/triggers/new-task';
import { newTimeEntry } from './lib/triggers/new-time-entry';
import { newTimeEntryStarted } from './lib/triggers/new-time-entry-started';
import { newTag } from './lib/triggers/new-tag';

export const togglTrack = createPiece({
  displayName: 'Toggl Track',
  description:
    'Toggl Track is a time tracking application that allows users to track their daily activities across different platforms. Works with classic Toggl Track and Toggl 2.0 accounts.',
  auth: togglTrackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/toggl-track.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["Pranith124", "onyedikachi-david"],
  actions: [
    createClient,
    createProject,
    createTask,
    createTag,
    createTimeEntry,
    startTimeEntry,
    stopTimeEntry,
    findUser,
    findProject,
    findTask,
    findClient,
    findTag,
    findTimeEntry,
    logTimeAi,
    startTimerAi,
    timeSummaryAi,
    getClient,
    updateClient,
    deleteClient,
    getProject,
    updateProject,
    updateTag,
    deleteTag,
    getTimeEntry,
    getCurrentTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    searchDetailedReport,
    listWorkspaces,
    getWorkspace,
    listOrganizationUsers,
    inviteUser,
    addUserToProject,
    createGroup,
    deleteGroup,
    createCustomApiCallAction({
      auth: togglTrackAuth,
      baseUrl: (auth) => (auth ? togglApi.baseUrl(auth) : ''),
      authMapping: async (auth) => ({
        Authorization: togglApi.authorizationHeader(auth),
      }),
    }),
  ],
  triggers: [
    newClient,
    newWorkspace,
    newProject,
    newTask,
    newTimeEntry,
    newTimeEntryStarted,
    newTag,
  ],
});