import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetWebPartsByPositionOutputSchema } from '../../../output-schemas';

export const listSectionWebPartsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_section_web_parts',
  outputSchema: microsoftSharepointGetWebPartsByPositionOutputSchema,
  displayName: 'List Section Web Parts',
  description: 'Lists the web parts in a column of a horizontal section on a SharePoint site page.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the web parts in one column of a horizontal section on a SharePoint site page in order; a web part position in this list is its Web Part Index. List Section Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    columnId: microsoftSharePointPageCommon.columnId(),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Record<string, unknown>>({
      auth,
      path: `${microsoftSharePointPageCommon.columnPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
        columnId: propsValue.columnId,
      })}/webparts`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
