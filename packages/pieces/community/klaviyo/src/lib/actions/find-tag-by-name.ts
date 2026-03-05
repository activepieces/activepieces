import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { KLAVIYO_API_URL, KLAVIYO_API_REVISION } from '../common';

export const findTagByName = createAction({
  auth: klaviyoAuth,
  name: 'find_tag_by_name',
  displayName: 'Find Tag by Name',
  description: 'Look up a Klaviyo tag by name to get its ID.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for.',
      required: true,
    }),
  },
  async run(context) {
    const filter = `equals(name,"${context.propsValue.name}")`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${KLAVIYO_API_URL}/tags`,
      queryParams: { filter },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth as string,
      },
      headers: {
        Accept: 'application/vnd.api+json',
        revision: KLAVIYO_API_REVISION,
      },
    });

    return response.body;
  },
});
