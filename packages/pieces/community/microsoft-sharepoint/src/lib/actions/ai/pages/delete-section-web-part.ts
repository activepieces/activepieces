import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointDeleteSectionWebPartOutputSchema } from '../../../output-schemas';

export const deleteSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_section_web_part',
  outputSchema: microsoftSharepointDeleteSectionWebPartOutputSchema,
  displayName: 'Delete Section Web Part',
  description: 'Deletes a web part from a horizontal section column on a SharePoint site page by its index.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes one web part from a column of a horizontal section on a SharePoint site page, found by its index; later web parts move up one index. List Section Web Parts returns the web parts in index order.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    columnId: microsoftSharePointPageCommon.columnId(),
    webPartIndex: microsoftSharePointPageCommon.webPartIndex({ listAction: 'List Section Web Parts' }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.columnPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
        columnId: propsValue.columnId,
      })}/webparts/${encodeURIComponent(propsValue.webPartIndex)}`)
      .delete();
    return { deleted: true, pageId: propsValue.pageId, horizontalSectionId: propsValue.horizontalSectionId, columnId: propsValue.columnId, webPartIndex: propsValue.webPartIndex };
  },
});
