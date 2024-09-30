import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { Client } from '@notionhq/client';

import { notionAuth } from '../..';
import { notionCommon } from '../common';
import { markdownToBlocks } from '@tryfabric/martian';

export const appendToPage = createAction({
  auth: notionAuth,
  name: 'append_to_page',
  displayName: 'Append to Page',
  description: 'Appends content to the end of a page.',
  props: {
    pageId: notionCommon.page,
    content: Property.LongText({
      displayName: 'Content',
      description:
        'The content you want to append. You can use markdown formatting.',
      required: true,
    }),
  },
  async run(context) {
    const { pageId, content } = context.propsValue;

    const notion = new Client({
      auth: (context.auth as OAuth2PropertyValue).access_token,
      notionVersion: '2022-02-22',
    });

    return await notion.blocks.children.append({
      block_id: pageId as string,
      children: markdownToBlocks(content),
    });
  },
});
