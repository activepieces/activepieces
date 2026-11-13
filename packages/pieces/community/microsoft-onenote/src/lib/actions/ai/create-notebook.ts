import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteCreateNotebookOutputSchema } from '../../output-schemas';

import type { Notebook } from '../../common/types';

export const createNotebookAiAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_notebook',
  outputSchema: microsoftOnenoteCreateNotebookOutputSchema,
  displayName: 'Create Notebook',
  description: 'Creates a OneNote notebook.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a OneNote notebook and returns it with its ID. Fails if a notebook with the same name exists.',
    idempotent: false,
  },
  props: {
    displayName: Property.ShortText({
      displayName: 'Name',
      description:
        'Notebook name, unique among your notebooks, at most 128 characters, without ?*/:<>|\'" characters.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response: Notebook = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/notebooks`)
      .post({ displayName: propsValue.displayName });
    return response;
  },
});
