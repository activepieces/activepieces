import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const lookupNews = createAction({
  auth: pubrioAuth,
  name: 'lookup_news',
  displayName: 'Lookup News',
  description: 'Look up detailed news information by news search ID',
  props: {
    news_search_id: Property.ShortText({
      displayName: 'News Search ID',
      required: true,
      description: 'The news search ID to look up',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      news_search_id: context.propsValue.news_search_id,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/news/lookup',
      body
    );
  },
});
