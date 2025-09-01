import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { findUser } from './lib/actions/find-user';
import { createClient } from './lib/actions/create-client';
import { newClient } from './lib/triggers/new-client';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { newProject } from './lib/triggers/new-project';
import { newTag } from './lib/triggers/new-tag';
import { newTask } from './lib/triggers/new-task';
import { newTimeEntry } from './lib/triggers/new-time-entry';
import { newTimeEntryStarted } from './lib/triggers/new-time-entry-started';
import { newWorkspace } from './lib/triggers/new-workspace-';
import { createProject } from './lib/actions/create-project-';
import { createTag } from './lib/actions/create-tag-';
import { createTask } from './lib/actions/create-task';
import { createTimeEntry } from './lib/actions/create-time-entry';
import { startTimeEntry } from './lib/actions/start-time-entry';
import { stopTimeEntry } from './lib/actions/stop-time-entry';
import { findClient } from './lib/actions/find-client';
import { findProject } from './lib/actions/find-project';
import { findTag } from './lib/actions/find-tag';
import { findTask } from './lib/actions/find-task';
import { findTimeEntry } from './lib/actions/find-time-entry';

export const toggleTrackAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Enter your Toggle Track API token',
  required: true,
});

export const toggltrack = createPiece({
  displayName: 'Toggltrack',
  auth: toggleTrackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/toggletrack.png',
  authors: [],
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) => {
        return 'https://api.track.toggl.com/api/v9';
      },
      auth: toggleTrackAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
            'base64'
          )}`,
          'Content-Type': 'application/json',
        };
      },
    }),

    createClient,
    createProject,
    createTask,
    createTag,
    createTimeEntry,
    startTimeEntry,
    stopTimeEntry,
    //search actions
    findUser,
    findProject,
    findTask,
    findClient,
    findTag,
    findTimeEntry,
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
