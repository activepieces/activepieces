import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointListHorizontalSectionsOutputSchema } from '../../../output-schemas';

export const listHorizontalSectionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_horizontal_sections',
  outputSchema: microsoftSharepointListHorizontalSectionsOutputSchema,
  displayName: 'List Horizontal Sections',
  description: 'Lists the horizontal sections of a SharePoint site page.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the horizontal sections of a SharePoint site page with their IDs, layouts, emphasis and columns.',
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
      path: `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/horizontalSections`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
