import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetWebPartsByPositionOutputSchema } from '../../../output-schemas';

export const listPageWebPartsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_page_web_parts',
  outputSchema: microsoftSharepointGetWebPartsByPositionOutputSchema,
  displayName: 'List Page Web Parts',
  description: 'Lists all web parts on a SharePoint site page.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every web part on a SharePoint site page, across all sections, with its ID, type and content. Use List Section Web Parts or List Vertical Section Web Parts for one section only.',
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
      path: `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/webparts`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
