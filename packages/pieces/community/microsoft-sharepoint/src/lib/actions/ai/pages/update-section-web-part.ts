import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointAddSectionWebPartOutputSchema } from '../../../output-schemas';

export const updateSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_section_web_part',
  outputSchema: microsoftSharepointAddSectionWebPartOutputSchema,
  displayName: 'Update Section Web Part',
  description: 'Updates a web part in a horizontal section column on a SharePoint site page by its index.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the content of one web part in a column of a horizontal section on a SharePoint site page, found by its index. List Section Web Parts returns the web parts in index order; changes stay in draft until Publish Page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    columnId: microsoftSharePointPageCommon.columnId(),
    webPartIndex: microsoftSharePointPageCommon.webPartIndex({ listAction: 'List Section Web Parts' }),
    webPart: microsoftSharePointPageCommon.webPart(),
  },
  async run({ auth, propsValue }) {
    const webPart: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.columnPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
        columnId: propsValue.columnId,
      })}/webparts/${encodeURIComponent(propsValue.webPartIndex)}`)
      .patch(microsoftSharePointPageCommon.webPartBody({ value: propsValue.webPart }));
    return webPart;
  },
});
