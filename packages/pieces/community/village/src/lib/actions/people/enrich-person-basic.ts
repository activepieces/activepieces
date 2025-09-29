import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const enrichPersonBasic = createAction({
  name: 'enrichPersonBasic',
  auth: villageAuth,
  displayName: 'Enrich Profile',
  description: 'Enrich a single person profile with basic professional information and work history',
  props: {
    village_id: Property.ShortText({
      displayName: 'Village ID',
      description: 'Village internal user ID',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      description: 'LinkedIn profile URL',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address',
      required: false,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { village_id, linkedin_url, email, user_identifier } = context.propsValue;
    
    // At least one identifier is required
    if (!village_id && !linkedin_url && !email) {
      throw new Error('At least one identifier (village_id, linkedin_url, or email) is required');
    }
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (village_id) queryParams.append('village_id', village_id);
    if (linkedin_url) queryParams.append('linkedin_url', linkedin_url);
    if (email) queryParams.append('email', email);
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.village.do/v1/people/enrich/basic?${queryParams.toString()}`,
      headers,
    });
    
    return res.body;
  },
});