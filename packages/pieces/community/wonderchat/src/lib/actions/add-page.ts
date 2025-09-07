import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wcRequest } from '../client';

export const addPage = createAction({
  name: 'add_page',
  displayName: 'Add Page',
  description: "Add a new page to your chatbot's knowledge base.",
  props: {
    botId: Property.ShortText({
      displayName: 'Bot ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'Source URL',
      required: false,
      description: 'If the page is sourced from a URL.',
    }),
    content: Property.LongText({
      displayName: 'Content',
      required: false,
      description: 'Raw text content to add as knowledge.',
    }),
    // Depending on the API, either url or content may be required; validate per docs.
  },
  async run(ctx) {
    const apiKey = ctx.auth as string;
    const { botId, title, url, content } = ctx.propsValue;

    // TODO: Verify endpoint and exact payload with Wonderchat docs.
    const result = await wcRequest<any>({
      apiKey,
      method: HttpMethod.POST,
      url: `/api/v1/bots/${botId}/knowledge/pages`, // TODO: confirm path
      body: {
        title,
        url,
        content,
      },
    });

    return result;
  },
});