import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const enrichEmail = createAction({
  name: 'enrichEmail',
  auth: villageAuth,
  displayName: 'Enrich Email',
  description: 'Enrich a single LinkedIn profile or Village ID with an email address',
  props: {
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'LinkedIn URL or Village ID',
      required: true,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { identifier, user_identifier } = context.propsValue;
    
    // Encode the identifier for use in the path
    const encodedIdentifier = encodeURIComponent(identifier);
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.village.do/v1/people/enrich/emails/${encodedIdentifier}`,
      headers,
    });
    
    return res.body;
  },
});