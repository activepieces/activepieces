import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { successFactorsAuth } from '../auth';
import { successFactorsHttp } from '../common/http';
import {
  SuccessFactorsODataSingleResponse,
  SuccessFactorsUser,
} from '../common/types';

export function mapSuccessFactorsUser(user: SuccessFactorsUser) {
  return {
    user_id: user.userId ?? null,
    username: user.username ?? null,
    first_name: user.firstName ?? null,
    last_name: user.lastName ?? null,
    email: user.email ?? null,
    status: user.status ?? null,
    person_id_external: user.personIdExternal ?? null,
    department: user.department ?? null,
    division: user.division ?? null,
    title: user.title ?? null,
  };
}

export const getUser = createAction({
  auth: successFactorsAuth,
  name: 'get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Retrieves a single SAP SuccessFactors user by user ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve one SAP SuccessFactors User record when you already know the user ID. This is a read-only lookup and is safe to retry.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      description:
        'The SuccessFactors userId of the user to retrieve. This is the key used by the OData V2 User entity.',
      required: true,
    }),
  },
  async run(context) {
    const userId = context.propsValue.user_id?.trim();

    if (!userId) {
      throw new Error('User ID is required.');
    }

    const accessToken = context.auth.access_token;

    if (!accessToken) {
      throw new Error('SAP SuccessFactors access token is missing.');
    }

    const response = await successFactorsHttp.apiCall<
      SuccessFactorsODataSingleResponse<SuccessFactorsUser>
    >({
      apiUrl: context.auth.props.api_url,
      accessToken,
      method: HttpMethod.GET,
      path: `/odata/v2/User('${successFactorsHttp.encodeODataKey(userId)}')`,
      queryParams: {
        '$format': 'JSON',
        '$select':
          'userId,username,firstName,lastName,email,status,personIdExternal,department,division,title',
      },
    });

    return mapSuccessFactorsUser(response.body.d);
  },
});
