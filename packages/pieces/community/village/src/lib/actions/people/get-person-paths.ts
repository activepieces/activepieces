import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const getPersonPaths = createAction({
  name: 'getPersonPaths',
  auth: villageAuth,
  displayName: 'Get Person Paths',
  description: 'Returns connection paths and warmth score to a LinkedIn profile',
  props: {
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'LinkedIn URL of the target person',
      required: true,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { linkedin_url, user_identifier } = context.propsValue;
    
    // Encode the URL for use in the path
    const encodedUrl = encodeURIComponent(linkedin_url);
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.village.do/v1/people/paths/${encodedUrl}`,
      headers,
    });
    
    return res.body;
  },
});