import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ghostAuth } from '../auth';
import { common } from '../common';
import { ghostCommon } from '../common/client';
import { ghostOriginalFindMemberOutputSchema } from '../output-schemas';

export const findMember = createAction({
  name: 'find_member',
  outputSchema: ghostOriginalFindMemberOutputSchema,
  classification: 'READ',
  displayName: 'Find Member',
  description: 'Find a member by email',
  audience: 'human',
  aiMetadata: { description: 'Looks up Ghost members filtered by an exact email address and returns the matches. Use to check whether a member exists or to resolve a member id before updating. Read-only and idempotent.', idempotent: true },
  auth: ghostAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
  },

  async run(context) {
    const response = await httpClient.sendRequest({
      url: `${context.auth.props.baseUrl}/ghost/api/admin/members`,
      method: HttpMethod.GET,
      headers: {
        Authorization: `Ghost ${common.jwtFromApiKey(context.auth.props.apiKey)}`,
      },
      queryParams: {
        filter: `email:${ghostCommon.nqlString(context.propsValue.email.trim())}`,
      },
    });

    return response.body;
  },
});
