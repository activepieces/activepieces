import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const findListByNameAction = createAction({
  auth: klaviyoAuth,
  name: 'find-list-by-name',
  displayName: 'Find List by Name',
  description: 'Find a Klaviyo list by its name.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { name } = propsValue;

    const response = await klaviyoApiCall({
      apiKey: auth,
      method: HttpMethod.GET,
      resourceUri: '/lists',
      query: {
        'filter': `name:${name}`,
        'page[size]': '10',
      },
    });

    const typedResponse = response as {
      data: {
        id: string;
        type: string;
        attributes: {
          name: string;
          created?: string;
          updated?: string;
          opt_in_process?: string;
        };
      }[];
    };

    const matched = typedResponse.data?.find(
      (list) => list.attributes.name.toLowerCase() === name.toLowerCase()
    );

    if (!matched) {
      throw new Error(`No list found with name "${name}"`);
    }

    return matched;
  },
});
