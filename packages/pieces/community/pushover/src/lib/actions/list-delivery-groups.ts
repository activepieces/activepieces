import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { listDeliveryGroupsOutputSchema } from '../output-schemas';

export const listDeliveryGroups = createAction({
  auth: pushoverAuth,
  name: 'list_delivery_groups',
  classification: 'READ',
  displayName: 'List Delivery Groups',
  description: 'List the delivery groups owned by the Pushover account',
  audience: 'ai',
  aiMetadata: {
    description:
      'List every delivery group on the account with its group key and name. This is the id resolver for every other group action: call it first to turn a group name into the group key that Get Delivery Group, Add User to Delivery Group and the rest require. Only groups owned by the same account as the application token are visible. Takes no input. Safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: listDeliveryGroupsOutputSchema,
  async run({ auth }) {
    const response = await pushoverApiCall<GroupsResponse>({
      method: HttpMethod.GET,
      resourceUri: '/groups.json',
      queryParams: { token: auth.props.api_token },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
    const groups = response.groups ?? [];

    return {
      groups,
      count: groups.length,
      status: response.status,
      request: response.request,
    };
  },
});

type GroupsResponse = {
  groups: { group: string; name: string }[];
  status: number;
  request: string;
};
