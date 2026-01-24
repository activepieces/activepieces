import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { newAttachment } from './lib/triggers/new-attachment';
import { newPerson } from './lib/triggers/new-person';
import { newSection } from './lib/triggers/new-section';
import { newComment } from './lib/triggers/new-comment';
import { newTaskLabel } from './lib/triggers/new-task-label';
import { newChecklistItem } from './lib/triggers/new-checklist-item';
import { newProject } from './lib/triggers/new-project';
import { newLabel } from './lib/triggers/new-label';
import { newTask } from './lib/triggers/new-task';
import { createLabel } from './lib/actions/create-label';
import { createTaskLabel } from './lib/actions/create-task-label';
import { createAttachment } from './lib/actions/create-attachment';
import { createTask } from './lib/actions/create-task';
import { updateTask } from './lib/actions/update-task';
import { findAttachment } from './lib/actions/find-attachment';
import { findLabel } from './lib/actions/find-label';
import { findPerson } from './lib/actions/find-person';
import { findTask } from './lib/actions/find-task';
import { findOrCreateAttachment } from './lib/actions/find-or-create-attachment';
import { findOrCreateTask } from './lib/actions/find-or-create-task';
import { findOrCreateLabel } from './lib/actions/find-or-create-label';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType, createCustomApiCallAction } from '@activepieces/pieces-common';
import { MEISTERTASK_API_URL } from './lib/common/common';



export const meistertaskAuth = PieceAuth.OAuth2({
  description: 'Authentication for MeisterTask (uses MindMeister OAuth2)',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  required: true,
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
  validate: async ({ auth }) => {
    const accessToken = (auth as OAuth2PropertyValue).access_token;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${MEISTERTASK_API_URL}/projects`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid token or insufficient scopes.',
      };
    }
  },
});


export const meistertask = createPiece({
  displayName: 'MeisterTask',
  description: 'Intuitive online task manager for teams, personal productivity, and everything in between.',
  auth: meistertaskAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/meistertask.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['Ani-4x', 'sanket-a11y'],
  actions: [
    createLabel,
    createTaskLabel,
    createAttachment,
    createTask,
    updateTask,
    findAttachment,
    findLabel,
    findPerson,
    findTask,
    findOrCreateAttachment,
    findOrCreateTask,
    findOrCreateLabel,
    createCustomApiCallAction({
      auth: meistertaskAuth,
      baseUrl: () => MEISTERTASK_API_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
        };
      },
    }),
  ],
  triggers: [
    newAttachment,
    newPerson,
    newSection,
    newComment,
    newTaskLabel,
    newChecklistItem,
    newProject,
    newLabel,
    newTask,
  ],
});