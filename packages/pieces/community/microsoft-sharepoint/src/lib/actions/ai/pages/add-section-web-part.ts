import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointAddSectionWebPartOutputSchema } from '../../../output-schemas';

export const addSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_add_section_web_part',
  outputSchema: microsoftSharepointAddSectionWebPartOutputSchema,
  displayName: 'Add Section Web Part',
  description: 'Adds a web part to a horizontal section column on a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a text or standard web part to one column of a horizontal section on a SharePoint site page, at the end or at a given index. List Section Columns returns the column IDs; changes stay in draft until Publish Page.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    horizontalSectionId: microsoftSharePointPageCommon.horizontalSectionId(),
    columnId: microsoftSharePointPageCommon.columnId(),
    webPart: microsoftSharePointPageCommon.webPart(),
    index: Property.Number({
      displayName: 'Index',
      description: 'Position to insert the web part at, starting at 1. Leave empty to add it at the end.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const webPart: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.columnPath({
        siteId: propsValue.siteId,
        pageId: propsValue.pageId,
        horizontalSectionId: propsValue.horizontalSectionId,
        columnId: propsValue.columnId,
      })}/webparts`)
      .query(propsValue.index === undefined || propsValue.index === null ? {} : { index: propsValue.index })
      .post(microsoftSharePointPageCommon.webPartBody({ value: propsValue.webPart }));
    return webPart;
  },
});
