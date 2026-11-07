import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetWebPartsByPositionOutputSchema } from '../../../output-schemas';

export const listVerticalSectionWebPartsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_vertical_section_web_parts',
  outputSchema: microsoftSharepointGetWebPartsByPositionOutputSchema,
  displayName: 'List Vertical Section Web Parts',
  description: 'Lists the web parts in the vertical section of a SharePoint site page.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the web parts in the vertical section of a SharePoint site page in order; a web part position in this list is its Web Part Index. Use List Page Web Parts for the whole page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Record<string, unknown>>({
      auth,
      path: `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection/webparts`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
