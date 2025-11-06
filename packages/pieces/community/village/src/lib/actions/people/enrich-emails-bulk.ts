import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const enrichEmailsBulk = createAction({
  name: 'enrichEmailsBulk',
  auth: villageAuth,
  displayName: 'Enrich Emails (Bulk)',
  description: 'Enrich multiple LinkedIn profiles or Village IDs with email addresses',
  props: {
    identifiers: Property.Array({
      displayName: 'Identifiers',
      description: 'Semicolon-separated list of LinkedIn URLs or Village IDs',
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
    
    // Join identifiers with semicolon and encode for URL
    const identifiersString = identifiers.join(';');
    const encodedIdentifiers = encodeURIComponent(identifiersString);
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.village.do/v1/people/enrich/emails/bulk/${encodedIdentifiers}`,
      headers,
    });
    
    return res.body;
  },
});