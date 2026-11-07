import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteOperationOutputSchema } from '../../output-schemas';

import type { OnenoteOperation } from '../../common/types';

export const copySectionToNotebookAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_copy_section_to_notebook',
  outputSchema: microsoftOnenoteOperationOutputSchema,
  displayName: 'Copy Section to Notebook',
  description: 'Starts copying a OneNote section to a notebook.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts copying a section (ID from List Sections) into a notebook (ID from List Notebooks). Returns the copy operation; poll Get Operation with its id until it succeeds to get the new section.',
    idempotent: false,
  },
  props: {
    sectionId: microsoftOneNoteAiProps.sectionId({ required: true }),
    destinationId: microsoftOneNoteAiProps.notebookId({
      required: true,
      displayName: 'Destination Notebook ID',
      description: 'Notebook to copy the section into. Use List Notebooks to find it.',
    }),
    renameAs: Property.ShortText({
      displayName: 'New Name',
      description: 'Name of the copy. Defaults to the original name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response: OnenoteOperation = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/sections/${encodeURIComponent(propsValue.sectionId)}/copyToNotebook`)
      .post({
        id: propsValue.destinationId,
        ...(propsValue.renameAs ? { renameAs: propsValue.renameAs } : {}),
      });
    return response;
  },
});
