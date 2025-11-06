import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../..';

export const sortPeople = createAction({
  name: 'sortPeople',
  auth: villageAuth,
  displayName: 'Sort People',
  description: 'Sort a list of LinkedIn profiles by relationship strength with the user',
  props: {
    people: Property.Array({
      displayName: 'People URLs',
      description: 'Array of LinkedIn URLs',
      required: true,
    }),
    user_identifier: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Specify the user making the request. This identifier should match the one you used when integrating the user with Village.',
      required: false,
    }),
  },
  async run(context) {
    const { people, user_identifier } = context.propsValue;
    
    const headers: Record<string, string> = {
      'secret-key': context.auth,
    };
    
    if (user_identifier) {
      headers['user-identifier'] = user_identifier;
    }
    
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.village.do/v1/people/sort',
      headers,
      body: {
        people,
      },
    });
    
    return res.body;
  },
});