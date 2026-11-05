import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointPageCommon } from './page-common';
import { microsoftSharepointCreatePageOutputSchema } from '../../../output-schemas';

const PAGE_LAYOUTS: string[] = ['article', 'home'];

export const createPageAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_create_page',
  outputSchema: microsoftSharepointCreatePageOutputSchema,
  displayName: 'Create Page',
  description: 'Creates a page in a SharePoint site.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a modern page in the Site Pages library of a SharePoint site, optionally with its full canvas layout. The page is created as an unpublished draft; use Publish Page to make it visible, and Create Horizontal Section or Add Section Web Part to add content later.',
    idempotent: false,
  },
  props: {
    siteId: microsoftSharePointAiProps.siteId({ required: true }),
    name: Property.ShortText({
      displayName: 'File Name',
      description: 'File name of the page, ending in .aspx, like "team-news.aspx".',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the page.',
      required: true,
    }),
    pageLayout: Property.StaticDropdown({
      displayName: 'Page Layout',
      description: 'Layout of the page.',
      required: true,
      options: {
        disabled: false,
        options: PAGE_LAYOUTS.map((value) => ({ label: value, value })),
      },
    }),
    canvasLayout: Property.Json({
      displayName: 'Canvas Layout',
      description:
        'Content of the page as a JSON object, like {"horizontalSections": [{"id": "1", "layout": "oneColumn", "emphasis": "none", "columns": [{"id": "1", "width": 12, "webparts": [{"id": "<new GUID>", "innerHtml": "<p>Hello</p>"}]}]}]}. Leave empty for a blank page.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.name.toLowerCase().endsWith('.aspx')) {
      throw new Error('File Name must end in .aspx.');
    }
    const body = {
      '@odata.type': '#microsoft.graph.sitePage',
      name: propsValue.name,
      title: propsValue.title,
      ...microsoftSharePointPageCommon.choice({
        key: 'pageLayout',
        value: propsValue.pageLayout,
        allowed: PAGE_LAYOUTS,
        propName: 'Page Layout',
      }),
      ...microsoftSharePointPageCommon.jsonObject({
        key: 'canvasLayout',
        value: propsValue.canvasLayout,
        propName: 'Canvas Layout',
      }),
    };
    const page: Record<string, unknown> = await microsoftSharePointClient
      .create({ auth })
      .api(`/sites/${encodeURIComponent(propsValue.siteId)}/pages`)
      .post(body);
    return page;
  },
});
