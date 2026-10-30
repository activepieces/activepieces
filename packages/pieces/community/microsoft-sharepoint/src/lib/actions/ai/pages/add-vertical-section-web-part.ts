import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointAddSectionWebPartOutputSchema } from '../../../output-schemas';

export const addVerticalSectionWebPartAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_add_vertical_section_web_part',
  outputSchema: microsoftSharepointAddSectionWebPartOutputSchema,
  displayName: 'Add Vertical Section Web Part',
  description: 'Adds a web part to the vertical section of a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a text or standard web part to the vertical section of a SharePoint site page, at the end or at a given index. The page needs a vertical section; use Create Vertical Section first. Changes stay in draft until Publish Page.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    webPart: microsoftSharePointPageCommon.webPart(),
    index: Property.Number({
      displayName: 'Index',
      description: 'Position to insert the web part at, starting at 0. Leave empty to add it at the end.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const webPart: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection/webparts`)
      .query(propsValue.index === undefined || propsValue.index === null ? {} : { index: propsValue.index })
      .post(microsoftSharePointPageCommon.webPartBody({ value: propsValue.webPart }));
    return webPart;
  },
});
