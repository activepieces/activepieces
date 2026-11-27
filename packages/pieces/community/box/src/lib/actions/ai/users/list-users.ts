import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxUtils } from '../../../common/utils';

const USER_TYPES = ['all', 'managed', 'external'];

export const listUsersAction = createAction({
  auth: boxAuth,
  name: 'box_list_users',
  displayName: 'List Users',
  description: 'Lists the users in the Box enterprise.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of enterprise users with their IDs, names and logins; needs admin rights. Filter by the start of a name or login with Filter Term. Page with Marker (next_marker).',
    idempotent: true,
  },
  props: {
    filterTerm: Property.ShortText({
      displayName: 'Filter Term',
      description: 'Only users whose name or login starts with this text. External users match only on their full login.',
      required: false,
    }),
    userType: Property.StaticDropdown({
      displayName: 'User Type',
      description: '"all", "managed" (default) or "external".',
      required: false,
      options: { options: USER_TYPES.map((value) => ({ label: value, value })) },
    }),
    externalAppUserId: Property.ShortText({
      displayName: 'External App User ID',
      description: 'Only app users with this external_app_user_id.',
      required: false,
    }),
    limit: boxAiProps.limit({ required: false }),
    marker: boxAiProps.marker({ required: false }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.userType !== undefined && !USER_TYPES.includes(propsValue.userType)) {
      throw new Error(`User Type must be one of: ${USER_TYPES.join(', ')}.`);
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/users',
      query: {
        usemarker: 'true',
        marker: propsValue.marker,
        limit: boxUtils.limitParam({ limit: propsValue.limit, max: 1000, fallback: 100 }),
        filter_term: propsValue.filterTerm,
        user_type: propsValue.userType,
        external_app_user_id: propsValue.externalAppUserId,
        fields: propsValue.fields,
      },
    });
  },
});
