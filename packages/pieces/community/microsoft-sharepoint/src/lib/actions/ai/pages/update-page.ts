import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointUpdatePageOutputSchema } from '../../../output-schemas';

const PROMOTION_KINDS: string[] = ['newsPost'];

export const updatePageAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_page',
  outputSchema: microsoftSharepointUpdatePageOutputSchema,
  displayName: 'Update Page',
  description: 'Updates the properties or content of a SharePoint site page.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates only the given fields of a SharePoint site page: title, description, thumbnail, comments, recommended pages, news promotion, title area or the whole canvas layout. Canvas Layout replaces the entire page content, so read it first with Get Page; to change one section or web part use the section and web part actions instead. Changes stay in draft until Publish Page.',
    idempotent: true,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    pageId: microsoftSharePointPageCommon.pageId(),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title of the page.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description of the page.',
      required: false,
    }),
    thumbnailWebUrl: Property.ShortText({
      displayName: 'Thumbnail URL',
      description: 'URL of the page thumbnail image.',
      required: false,
    }),
    showComments: microsoftSharePointAiProps.booleanProp({
      displayName: 'Show Comments',
      description: 'Whether comments show at the bottom of the page. Leave empty to keep the current setting.',
    }),
    showRecommendedPages: microsoftSharePointAiProps.booleanProp({
      displayName: 'Show Recommended Pages',
      description: 'Whether recommended pages show at the bottom of the page. Leave empty to keep the current setting.',
    }),
    promotionKind: Property.StaticDropdown({
      displayName: 'Promotion Kind',
      description: 'Set to newsPost to promote the page to a news post. Demoting a news post is not supported.',
      required: false,
      options: {
        disabled: false,
        options: PROMOTION_KINDS.map((value) => ({ label: value, value })),
      },
    }),
    titleArea: Property.Json({
      displayName: 'Title Area',
      description:
        'Title area settings as a JSON object, like {"layout": "colorBlock", "textAlignment": "left", "showAuthor": true}.',
      required: false,
    }),
    canvasLayout: Property.Json({
      displayName: 'Canvas Layout',
      description:
        'The whole page content as a JSON object with "horizontalSections" and optionally "verticalSection". Replaces all existing content.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const changes = {
      ...microsoftSharePointUtils.optionalText({ key: 'title', value: propsValue.title }),
      ...microsoftSharePointUtils.optionalText({ key: 'description', value: propsValue.description }),
      ...microsoftSharePointUtils.optionalText({ key: 'thumbnailWebUrl', value: propsValue.thumbnailWebUrl }),
      ...microsoftSharePointUtils.optionalBoolean({ key: 'showComments', value: propsValue.showComments, propName: 'Show Comments' }),
      ...microsoftSharePointUtils.optionalBoolean({
        key: 'showRecommendedPages',
        value: propsValue.showRecommendedPages,
        propName: 'Show Recommended Pages',
      }),
      ...microsoftSharePointPageCommon.choice({
        key: 'promotionKind',
        value: propsValue.promotionKind,
        allowed: PROMOTION_KINDS,
        propName: 'Promotion Kind',
      }),
      ...microsoftSharePointPageCommon.jsonObject({ key: 'titleArea', value: propsValue.titleArea, propName: 'Title Area' }),
      ...microsoftSharePointPageCommon.jsonObject({
        key: 'canvasLayout',
        value: propsValue.canvasLayout,
        propName: 'Canvas Layout',
      }),
    };
    if (Object.keys(changes).length === 0) {
      throw new Error('Set at least one page field to update.');
    }
    const page: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(microsoftSharePointPageCommon.pagePath({ siteId: propsValue.siteId, pageId: propsValue.pageId }))
      .patch({ '@odata.type': '#microsoft.graph.sitePage', ...changes });
    return page;
  },
});
