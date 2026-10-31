import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetSectionColumnOutputSchema } from '../../../output-schemas';

export const getSectionColumnAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_section_column',
  outputSchema: microsoftSharepointGetSectionColumnOutputSchema,
  displayName: 'Get Section Column',
  description: 'Gets a column of a horizontal section on a SharePoint site page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one column of a horizontal section on a SharePoint site page with its width and web parts. List Section Columns returns the column IDs.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    columnId: microsoftSharePointPageCommon.columnId(),
  },
  async run({ auth, propsValue }) {
    const column: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(microsoftSharePointPageCommon.columnPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
        columnId: propsValue.columnId,
      }))
      .get();
    return column;
  },
});
