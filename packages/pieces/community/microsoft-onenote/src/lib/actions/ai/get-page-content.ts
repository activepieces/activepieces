import { ResponseType } from '@microsoft/microsoft-graph-client';

import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOneNoteUtils } from '../../common/utils';
import { microsoftOnenoteGetPageContentOutputSchema } from '../../output-schemas';

export const getPageContentAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_page_content',
  outputSchema: microsoftOnenoteGetPageContentOutputSchema,
  displayName: 'Get Page Content',
  description: 'Gets the HTML content of a OneNote page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets a OneNote page's body as HTML (page ID from List Pages). Set Include Element IDs to true to get the data-id and id attributes Update Page Content needs as targets. Images and files appear as resource URLs; use Get Resource Content to download one.",
    idempotent: true,
  },
  props: {
    pageId: microsoftOneNoteAiProps.pageId({ required: true }),
    includeIds: Property.StaticDropdown({
      displayName: 'Include Element IDs',
      description: 'Whether to add the element IDs that Update Page Content can target.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const includeIds = microsoftOneNoteUtils.booleanChoice({
      value: propsValue.includeIds,
      propName: 'Include Element IDs',
    });
    const content: string = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/pages/${encodeURIComponent(propsValue.pageId)}/content`)
      .query(includeIds ? { includeIDs: 'true' } : {})
      .responseType(ResponseType.TEXT)
      .get();
    return { pageId: propsValue.pageId, content };
  },
});
