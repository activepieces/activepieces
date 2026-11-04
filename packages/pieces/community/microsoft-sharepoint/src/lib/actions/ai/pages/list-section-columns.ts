import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointListSectionColumnsOutputSchema } from '../../../output-schemas';

export const listSectionColumnsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_section_columns',
  outputSchema: microsoftSharepointListSectionColumnsOutputSchema,
  displayName: 'List Section Columns',
  description: 'Lists the columns of a horizontal section on a SharePoint site page.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the columns of one horizontal section on a SharePoint site page with their IDs, widths and web parts. List Horizontal Sections returns the section IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Record<string, unknown>>({
      auth,
      path: `${microsoftSharePointPageCommon.horizontalSectionPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
      })}/columns`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
