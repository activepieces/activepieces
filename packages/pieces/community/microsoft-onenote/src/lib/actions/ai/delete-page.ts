import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteDeletePageOutputSchema } from '../../output-schemas';

export const deletePageAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_delete_page',
  outputSchema: microsoftOnenoteDeletePageOutputSchema,
  displayName: 'Delete Page',
  description: 'Deletes a OneNote page.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Permanently deletes a OneNote page (ID from List Pages). It goes to the notebook's recycle bin in the OneNote apps but can't be restored through this connection. A second call for the same page fails with not found.",
    idempotent: false,
  },
  props: {
    pageId: microsoftOneNoteAiProps.pageId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/pages/${encodeURIComponent(propsValue.pageId)}`)
      .delete();
    return { pageId: propsValue.pageId, deleted: true };
  },
});
