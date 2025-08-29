
    import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
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
import { newClient } from './lib/triggers/new-client';
import { newProject } from './lib/triggers/new-project';
import { newTask } from './lib/triggers/new-task';
import { newTimeEntry } from './lib/triggers/new-time-entry';
import { newTag } from './lib/triggers/new-tag';
import { newTimeEntryStarted } from './lib/triggers/new-time-entry-started';
import { newWorkspace } from './lib/triggers/new-workspace';

export const togglTrackAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: 'Your Toggl Track API token.',
  required: true,
});

export const togglTrack = createPiece({
  displayName: 'Toggl Track',
  auth: togglTrackAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/toggl-track.png',
  authors: [],
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
  ],
  triggers: [
    newClient,
    newProject,
    newTask,
    newTimeEntry,
    newTag,
    newTimeEntryStarted,
    newWorkspace,
  ],
});
    