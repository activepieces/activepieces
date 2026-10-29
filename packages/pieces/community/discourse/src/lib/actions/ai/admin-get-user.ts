import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const adminGetUserAction = createAction({
  auth: discourseAuth,
  name: 'admin_get_user',
  classification: 'READ',
  displayName: 'Admin Get User',
  description: 'Returns the admin view of a Discourse user, including email.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the admin view of a Discourse user by numeric user ID, including email, approval state, last IP and SSO external ID. Needs an admin key. The output contains personal data, so only use it when the task requires it. Read-only.',
    idempotent: true,
  },
  props: {
    user_id: Property.ShortText({ displayName: 'User ID', description: 'Numeric user ID.', required: true }),
  },
  outputSchema: discourseSchemas.adminUser,
  async run({ auth, propsValue }) {
    const id = discourseInput.id({ value: propsValue.user_id, label: 'User ID' });
    const body = await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/admin/users/${id}.json` });
    return discourseMap.adminUser({ raw: body, baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
