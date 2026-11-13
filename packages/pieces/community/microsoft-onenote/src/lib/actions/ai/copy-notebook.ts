import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteOperationOutputSchema } from '../../output-schemas';

import type { OnenoteOperation } from '../../common/types';

export const copyNotebookAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_copy_notebook',
  outputSchema: microsoftOnenoteOperationOutputSchema,
  displayName: 'Copy Notebook',
  description: 'Starts copying a OneNote notebook.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts copying a notebook (ID from List Notebooks) to your OneDrive. Returns the copy operation; poll Get Operation with its id until it succeeds to get the new notebook. Work or school accounts only.',
    idempotent: false,
  },
  props: {
    notebookId: microsoftOneNoteAiProps.notebookId({ required: true }),
    renameAs: Property.ShortText({
      displayName: 'New Name',
      description: 'Name of the copy. Defaults to the original name.',
      required: false,
    }),
    notebookFolder: Property.ShortText({
      displayName: 'Notebook Folder',
      description:
        'Folder in your OneDrive to put the copy in. Created if missing. Defaults to Notebooks.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response: OnenoteOperation = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/notebooks/${encodeURIComponent(propsValue.notebookId)}/copyNotebook`)
      .post({
        ...(propsValue.renameAs ? { renameAs: propsValue.renameAs } : {}),
        ...(propsValue.notebookFolder ? { notebookFolder: propsValue.notebookFolder } : {}),
      });
    return response;
  },
});
