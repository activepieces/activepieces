import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetPageOutputSchema } from '../../output-schemas';

import type { OnenotePage } from '../../common/types';

export const getPageAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_page',
  outputSchema: microsoftOnenoteGetPageOutputSchema,
  displayName: 'Get Page',
  description: 'Gets a OneNote page by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one OneNote page's metadata (ID from List Pages): title, dates, links, parent notebook and parent section. Use Get Page Content for its HTML body or Get Page Preview for a short text preview.",
    idempotent: true,
  },
  props: {
    pageId: microsoftOneNoteAiProps.pageId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: OnenotePage = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/pages/${encodeURIComponent(propsValue.pageId)}`)
      .expand(['parentNotebook', 'parentSection'])
      .get();
    return response;
  },
});
