import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointGetVerticalSectionOutputSchema } from '../../../output-schemas';

export const updateVerticalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_vertical_section',
  outputSchema: microsoftSharepointGetVerticalSectionOutputSchema,
  displayName: 'Update Vertical Section',
  description: 'Updates the emphasis of the vertical section of a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the background emphasis of the vertical section (the side column) of a SharePoint site page. Use the vertical section web part actions to change its content; changes stay in draft until Publish Page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    emphasis: microsoftSharePointPageCommon.emphasis({ required: true }),
  },
  async run({ auth, propsValue }) {
    const section: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection`
      )
      .patch(microsoftSharePointPageCommon.emphasisValue({ value: propsValue.emphasis }));
    return section;
  },
});
