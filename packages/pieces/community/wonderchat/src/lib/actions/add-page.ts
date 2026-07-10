import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wonderchatAuth } from '../..';

export const addPage = createAction({
  name: 'addPage',
  displayName: 'Add Page',
  description: 'Add new pages to your chatbot’s knowledge base.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one or more webpage URLs to a specific Wonderchat chatbot’s knowledge base (identified by chatbotId), triggering Wonderchat to crawl and ingest them. Use when an agent needs to expand or update what a bot can answer from. Optionally provide a session cookie to crawl pages behind a login. Not idempotent: each call appends/re-ingests pages into the knowledge base.',
    idempotent: false,
  },
  auth: wonderchatAuth,
  props: {
    chatbotId: Property.ShortText({
      displayName: 'Chatbot Id',
      description: 'The ID of your chatbot (can be found in the URL when viewing your bot: /bot/YOUR_BOT_ID)',
      required: true,
    }),
    urls: Property.Array({
      displayName: 'URLs',
      description: 'List of webpage URLs to add to your chatbot\'s knowledge base (e.g., "https://wonderchat.io")',
      required: false,
    }),
    sessionCookie: Property.LongText({
      displayName: 'Session cookie',
      description: 'Session cookie for crawling sites behind login',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const { chatbotId, urls, sessionCookie } = propsValue;
    
    const requestbody: any = {
      apiKey,
      chatbotId,  
    };
    if (sessionCookie) {
      requestbody.sessionCookie = sessionCookie;
    }
    if (urls) {
      requestbody.urls = urls;
    }
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://app.wonderchat.io/api/v1/add-pages',
      headers: { 'Content-Type': 'application/json'},
      body: requestbody,
    });
    return response.body;
  },
});
