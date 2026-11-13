import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetVerticalSectionOutputSchema } from '../../../output-schemas';

export const getVerticalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_vertical_section',
  outputSchema: microsoftSharepointGetVerticalSectionOutputSchema,
  displayName: 'Get Vertical Section',
  description: 'Gets the vertical section of a SharePoint site page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the vertical section (the side column) of a SharePoint site page with its emphasis and web parts. Fails with 404 when the page has no vertical section.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
  },
  async run({ auth, propsValue }) {
    const section: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection`)
      .get();
    return section;
  },
});
