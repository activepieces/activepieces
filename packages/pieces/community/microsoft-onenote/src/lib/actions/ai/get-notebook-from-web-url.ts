import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetNotebookFromWebUrlOutputSchema } from '../../output-schemas';

import type { CopyNotebookModel } from '../../common/types';

export const getNotebookFromWebUrlAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_notebook_from_web_url',
  outputSchema: microsoftOnenoteGetNotebookFromWebUrlOutputSchema,
  displayName: 'Get Notebook from Web URL',
  description: 'Gets a OneNote notebook from its web URL.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Resolves a OneNote notebook web URL (the oneNoteWebUrl a link or Get Recent Notebooks gives) to the notebook with its ID, so other actions can use it. Work or school accounts only.',
    idempotent: true,
  },
  props: {
    webUrl: Property.ShortText({
      displayName: 'Web URL',
      description: 'The notebook web URL, for example its OneNote for the web link.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response: CopyNotebookModel = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/notebooks/getNotebookFromWebUrl`)
      .post({ webUrl: propsValue.webUrl });
    return response;
  },
});
