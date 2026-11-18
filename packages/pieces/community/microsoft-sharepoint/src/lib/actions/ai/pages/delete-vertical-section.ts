import { createAction } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointDeletePageOutputSchema } from '../../../output-schemas';

export const deleteVerticalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_vertical_section',
  outputSchema: microsoftSharepointDeletePageOutputSchema,
  displayName: 'Delete Vertical Section',
  description: 'Deletes the vertical section of a SharePoint site page.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes the vertical section (the side column) of a SharePoint site page together with its web parts.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection`)
      .delete();
    return { deleted: true, pageId: propsValue.pageId };
  },
});
