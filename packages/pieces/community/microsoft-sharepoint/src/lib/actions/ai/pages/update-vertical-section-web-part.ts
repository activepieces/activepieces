import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointAddSectionWebPartOutputSchema } from '../../../output-schemas';

export const updateVerticalSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_vertical_section_web_part',
  outputSchema: microsoftSharepointAddSectionWebPartOutputSchema,
  displayName: 'Update Vertical Section Web Part',
  description: 'Updates a web part in the vertical section of a SharePoint site page by its index.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the content of one web part in the vertical section of a SharePoint site page, found by its index. List Vertical Section Web Parts returns the web parts in index order; changes stay in draft until Publish Page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPartIndex: microsoftSharePointPageCommon.webPartIndex({ listAction: 'List Vertical Section Web Parts' }),
    webPart: microsoftSharePointPageCommon.webPart(),
  },
  async run({ auth, propsValue }) {
    const webPart: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection/webparts/${encodeURIComponent(propsValue.webPartIndex)}`)
      .patch(microsoftSharePointPageCommon.webPartBody({ value: propsValue.webPart }));
    return webPart;
  },
});
