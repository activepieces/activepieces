import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { discourseAuth } from '../../auth';
import { discourseRequest } from '../../common/client';
import { discourseInput } from '../../common/input';
import { discourseMap } from '../../common/mappers';
import { discourseOps } from '../../common/operations';
import { discourseSchemas } from '../../common/schemas';

export const getUserByExternalIdAction = createAction({
  auth: discourseAuth,
  name: 'get_user_by_external_id',
  classification: 'READ',
  displayName: 'Get User by External ID',
  description: 'Returns a Discourse user by their DiscourseConnect (SSO) external ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get a Discourse user by the external ID your system sent through DiscourseConnect (SSO). Only works on forums that use DiscourseConnect. Read-only.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({ displayName: 'External ID', required: true }),
  },
  outputSchema: discourseSchemas.user,
  async run({ auth, propsValue }) {
    const externalId = discourseInput.name({ value: propsValue.external_id, label: 'External ID' });
    const body = discourseMap.rec(
      await discourseRequest({ auth: auth.props, method: HttpMethod.GET, path: `/u/by-external/${externalId}.json` }),
    );
    return discourseMap.user({ raw: body['user'], baseUrl: discourseOps.baseUrl(auth.props) });
  },
});
