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
      description: 'Add people to enrich (max 10)',
      properties: {
        identifierType: Property.StaticDropdown({
          displayName: 'Identifier Type',
          required: true,
          options: {
            options: [
              { label: 'Village ID', value: 'village_id' },
              { label: 'LinkedIn URL', value: 'linkedin_url' },
              { label: 'Email', value: 'email' },
            ],
          },
        }),
        identifierValue: Property.ShortText({
          displayName: 'Identifier Value',
          description: 'Enter the Village ID, LinkedIn URL, or Email',
          required: true,
        }),
      },
      required: true,
      defaultValue: [],
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
    
    // Transform the array data to match API format
    const formattedIdentifiers = identifiers.map((item: any) => ({
      [item.identifierType]: item.identifierValue
    }));
    
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
        identifiers: formattedIdentifiers,
      },
    });
    
    return res.body;
  },
});