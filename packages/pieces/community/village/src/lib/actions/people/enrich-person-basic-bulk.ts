import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const enrichPersonBasicBulk = createAction({
  name: 'enrichPersonBasicBulk',
  auth: villageAuth,
  displayName: 'Enrich Profile - Bulk',
  description: 'Enrich multiple person profiles (max 10) with basic professional information and work history.',
  props: {
    identifiers: Property.Array({
      displayName: 'Identifiers',
      description: 'Array of identifier objects (max 10). Each object should have one of: village_id, linkedin_url, or email',
      required: true,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { identifiers, user_identifier } = context.propsValue;
    
    if (!identifiers || identifiers.length === 0) {
      throw new Error('At least one identifier is required');
    }
    
    if (identifiers.length > 10) {
      throw new Error('Maximum of 10 identifiers allowed per request');
    }
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.village.do/v1/people/enrich/basic/bulk',
      headers,
      body: {
        identifiers,
      },
    });
    
    return res.body;
  },
});