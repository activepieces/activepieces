import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dappierAuth } from '../..';
import { dappierCommon } from '../common';

export const realTimeWebSearch = createAction({
  name: 'real_time_web_search',
  auth: dappierAuth,
  displayName: 'Real Time Data',
  description:
    'Access real-time Google web search results including the latest news, weather, travel, deals and more.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a real-time Google-style web search via Dappier and returns AI-summarized results for a free-text query covering general topics like news, weather, travel, and deals. Choose this for broad, up-to-the-minute open-web lookups rather than a specific vertical (stocks, sports, or lifestyle). Requires a natural-language search query; read-only and safe to repeat.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Enter your search query',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${dappierCommon.baseUrl}/app/aimodel/am_01j0rzq4tvfscrgzwac7jv1p4c`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
      },
    });

    return res.body;
  },
});
