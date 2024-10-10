import { createAction, Property } from '@activepieces/pieces-framework';

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../..';

export const fetchPeoplePaths = createAction({
  name: 'fetchPeoplePaths',
  auth: villageAuth,
  displayName: 'People Paths',
  description: 'fetch people paths',
  props: {
    userReference: Property.LongText({
      displayName: 'User Reference',
      description: `If you're a Village Partner, use this field that identifies your user`,
      required: false,
    }),
    targetLinkedinId: Property.LongText({
      displayName: 'Target Linkedin Identifier',
      description: `The Linkedin Identifier (slug) of the person you're trying to find paths to.`,
      required: true,
    }),
  },
  async run(context) {
    const { targetLinkedinId, userReference } =
    context.propsValue;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://api.village.do/v1/people/paths',
      headers: {
        'X-Village-Secret-Key': context.auth, // Pass API key in headers
      },
      body: {
        targetLinkedinId,
        userReference
      }
    });
    return res.body;
  },
});
