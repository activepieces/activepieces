import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetNotebookOutputSchema } from '../../output-schemas';

import type { Notebook } from '../../common/types';

export const getNotebookAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_notebook',
  outputSchema: microsoftOnenoteGetNotebookOutputSchema,
  displayName: 'Get Notebook',
  description: 'Gets a OneNote notebook by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one OneNote notebook (ID from List Notebooks) with its name, owner, sharing state and links.',
    idempotent: true,
  },
  props: {
    notebookId: microsoftOneNoteAiProps.notebookId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: Notebook = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/notebooks/${encodeURIComponent(propsValue.notebookId)}`)
      .get();
    return response;
  },
});
