import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetPagePreviewOutputSchema } from '../../output-schemas';

import type { OnenotePagePreview } from '../../common/types';

export const getPagePreviewAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_page_preview',
  outputSchema: microsoftOnenoteGetPagePreviewOutputSchema,
  displayName: 'Get Page Preview',
  description: 'Gets a short text preview of a OneNote page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets a short plain-text preview (up to about 300 characters) and preview image link of a OneNote page (ID from List Pages). Cheaper than Get Page Content when you only need to tell pages apart.',
    idempotent: true,
  },
  props: {
    pageId: microsoftOneNoteAiProps.pageId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: OnenotePagePreview = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/pages/${encodeURIComponent(propsValue.pageId)}/preview()`)
      .get();
    return response;
  },
});
