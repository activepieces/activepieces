import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
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
import { newWorkspace } from './lib/triggers/new-workspace';
import { newProject } from './lib/triggers/new-project';
import { newTask } from './lib/triggers/new-task';
import { newTimeEntry } from './lib/triggers/new-time-entry';
import { newTimeEntryStarted } from './lib/triggers/new-time-entry-started';
import { newTag } from './lib/triggers/new-tag';

const validateAuth = async ({ auth }: { auth: string }) => {
  try {
    await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.track.toggl.com/api/v9/me',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${auth}:api_token`).toString(
          'base64'
        )}`,
      },
    });
    return {
      valid: true as const,
    };
  } catch (e) {
    return {
      valid: false as const,
      error: 'Invalid API token.',
    };
  }
};

export const togglTrackAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `
  1. Log in to your Toggl Track account.
  2. Go to your **Profile settings**.
  3. Find the **API Token** at the bottom of the page and copy it.
  `,
  required: true,
  validate: validateAuth,
});

export const togglTrack = createPiece({
  displayName: 'Toggl Track',
  description: 'Toggl Track is a time tracking application that allows users to track their daily activities across different platforms.',
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