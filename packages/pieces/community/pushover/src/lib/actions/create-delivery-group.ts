import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import { GROUP_OWNERSHIP_HINT, pushoverApiCall } from '../common';
import { createDeliveryGroupOutputSchema } from '../output-schemas';

export const createDeliveryGroup = createAction({
  auth: pushoverAuth,
  name: 'create_delivery_group',
  classification: 'WRITE',
  displayName: 'Create Delivery Group',
  description: 'Create a Pushover delivery group, or return the existing one with that name',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get or create a delivery group by name and return its group key. Pushover allows only one group per name on an account, so this action lists the existing groups first and returns the match with created=false instead of failing; it only creates when the name is unused, returning created=true. Safe to retry: a second call with the same name returns the same group key. Add members afterwards with Add User to Delivery Group.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'Name of the delivery group, for example On-Call Engineers. Matching against existing groups is exact and case-sensitive.',
      required: true,
    }),
  },
  outputSchema: createDeliveryGroupOutputSchema,
  async run({ auth, propsValue }) {
    const existingGroups = await pushoverApiCall<GroupsResponse>({
      method: HttpMethod.GET,
      resourceUri: '/groups.json',
      queryParams: { token: auth.props.api_token },
      errorHint: GROUP_OWNERSHIP_HINT,
    });
    const match = (existingGroups.groups ?? []).find(
      (group) => group.name === propsValue.name
    );
    if (match !== undefined) {
      return {
        group: match.group,
        name: match.name,
        created: false,
      };
    }

    const created = await pushoverApiCall<CreateGroupResponse>({
      method: HttpMethod.POST,
      resourceUri: '/groups.json',
      body: {
        token: auth.props.api_token,
        name: propsValue.name,
      },
      errorHint: GROUP_OWNERSHIP_HINT,
    });

    return {
      group: created.group,
      name: propsValue.name,
      created: true,
    };
  },
});

type GroupsResponse = {
  groups: { group: string; name: string }[];
};

type CreateGroupResponse = {
  group: string;
};
