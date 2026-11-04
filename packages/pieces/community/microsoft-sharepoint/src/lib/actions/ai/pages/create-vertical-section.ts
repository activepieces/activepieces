import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointCreateVerticalSectionOutputSchema } from '../../../output-schemas';

export const createVerticalSectionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_vertical_section',
  outputSchema: microsoftSharepointCreateVerticalSectionOutputSchema,
  displayName: 'Create Vertical Section',
  description: 'Creates the vertical section of a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates the vertical section (the side column) of a SharePoint site page, with at least one web part, each given a new GUID as its id (Microsoft Graph rejects an empty section). A page has at most one vertical section; use Update Vertical Section to change its emphasis and Add Vertical Section Web Part to add content later. Changes stay in draft until Publish Page.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    emphasis: microsoftSharePointPageCommon.emphasis({ required: false }),
    webParts: Property.Json({
      displayName: 'Web Parts',
      description:
        'Web parts of the section as a JSON list with at least one item, each with a new GUID as its id, like [{"id": "<new GUID>", "innerHtml": "<p>Hello</p>"}].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const webParts = microsoftSharePointPageCommon.jsonList({ key: 'webparts', value: propsValue.webParts, propName: 'Web Parts' });
    if (!webParts['webparts']?.length) {
      throw new Error('Web Parts must hold at least one web part; Microsoft Graph cannot create an empty vertical section.');
    }
    const section: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(
        `${microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId })}/canvasLayout/verticalSection`
      )
      .put({
        ...microsoftSharePointPageCommon.emphasisValue({ value: propsValue.emphasis }),
        ...webParts,
      });
    return section;
  },
});
