import { zuoraAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessToken } from '../common';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export const findAccountAction = createAction({
  auth: zuoraAuth,
  name: 'find-account',
  displayName: 'Find Customer Account',
  description: 'Retrieves account based on name.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up Zuora customer accounts whose name exactly matches the given value, via an object query. Use to resolve an account before billing or further account operations; matching is an exact equality on the account name, not a partial or fuzzy search. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Account Name',
      required: true,
    }),
  },
  async run(context) {
    const name = context.propsValue.name;
    const token = await getAccessToken(context.auth);

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${context.auth.props.environment}/object-query/accounts`,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      queryParams: {
        'filter[]': `name.EQ:${name}`,
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
