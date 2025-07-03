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
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
      },
    });

    return res.body;
  },
});
