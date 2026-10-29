import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteOperationOutputSchema } from '../../output-schemas';

import type { OnenoteOperation } from '../../common/types';

export const copyPageToSectionAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_copy_page_to_section',
  outputSchema: microsoftOnenoteOperationOutputSchema,
  displayName: 'Copy Page to Section',
  description: 'Starts copying a OneNote page to a section.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts copying a page (ID from List Pages) into a section (ID from List Sections). Returns the copy operation; poll Get Operation with its id until it succeeds to get the new page.',
    idempotent: false,
  },
  props: {
    pageId: microsoftOneNoteAiProps.pageId({ required: true }),
    destinationId: microsoftOneNoteAiProps.sectionId({
      required: true,
      displayName: 'Destination Section ID',
      description: 'Section to copy the page into. Use List Sections to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    const response: OnenoteOperation = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/pages/${encodeURIComponent(propsValue.pageId)}/copyToSection`)
      .post({
        id: propsValue.destinationId,
      });
    return response;
  },
});
