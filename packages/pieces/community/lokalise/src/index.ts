import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { lokaliseAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';
import { createComment } from './lib/actions/create-comment';
import { createProject } from './lib/actions/create-project';
import { createKey } from './lib/actions/create-key';
import { createTask } from './lib/actions/create-task';
import { retrieveTranslation } from './lib/actions/retrieve-translation';
import { updateKey } from './lib/actions/update-key';
import { updateTranslation } from './lib/actions/update-translation';
import { deleteKey } from './lib/actions/delete-key';
import { retrieveAComment } from './lib/actions/retrieve-a-comment';
import { retrieveAProject } from './lib/actions/retrieve-a-project';
import { retrieveAKey } from './lib/actions/retrieve-a-key';

import { keyAdded } from './lib/triggers/key-added';
import { keyUpdated } from './lib/triggers/key-updated';
import { translationUpdated } from './lib/triggers/translation-updated';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const lokalise = createPiece({
  displayName: 'Lokalise',
  auth: lokaliseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lokalise.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.DEVELOPER_TOOLS],
  description: 'Lokalise is a collaborative translation platform.',
  actions: [
    createComment,
    createKey,
    createProject,
    createTask,
    deleteKey,
    retrieveAComment,
    retrieveAKey,
    retrieveAProject,
    retrieveTranslation,
    updateKey,
    updateTranslation,
    createCustomApiCallAction({
      auth: lokaliseAuth,
      baseUrl: () => 'https://api.lokalise.com/api2',
      authMapping: async (auth) => {
        return {
          'X-Api-Token': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [keyAdded, keyUpdated, translationUpdated],
});
