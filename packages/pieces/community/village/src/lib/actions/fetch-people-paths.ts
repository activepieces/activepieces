import { createAction, Property } from '@activepieces/pieces-framework';

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../..';

export const fetchPeoplePaths = createAction({
  name: 'fetchPeoplePaths',
  auth: villageAuth,
  displayName: 'Find Person Paths',
  description: 'Enrich a person record with all available intro paths',
  props: {
    user_identifier: Property.LongText({
      displayName: 'User Identifier',
      description: `If you're a Village Partner, use this field that identifies your user`,
      required: false,
    }),
    person_linkedin_url: Property.LongText({
      displayName: 'Person Linkedin URL',
      description: `The Linkedin URL of the person you're trying to find paths to.`,
      required: true,
    }),
  },
  async run(context) {
    const { person_linkedin_url, user_identifier } = context.propsValue;

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://api.village.do/v1/people/paths',
      headers: {
        'X-Village-Secret-Key': context.auth, // Pass API key in headers
      },
      body: {
        person_linkedin_url,
        user_identifier,
      },
    });
    return res.body;
  },
});
