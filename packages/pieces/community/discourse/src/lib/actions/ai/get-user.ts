import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getUserAction = createAction({
  auth: discourseAuth,
  name: 'get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Returns a Discourse user profile by username.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get a Discourse user public profile by username, including numeric user ID, trust level, staff flags and suspension dates. No email; use Admin Get User for that. Read-only.',
    idempotent: true,
  },
  props: {
    username: Property.ShortText({ displayName: 'Username', required: true }),
  },
  outputSchema: discourseSchemas.user,
  async run({ auth, propsValue }) {
    const username = discourseInput.name({ value: propsValue.username, label: 'Username' });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/u/${username}.json` }),
    );
    return discourseMap.user({ raw: body['user'], baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
