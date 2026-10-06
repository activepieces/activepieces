import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pushoverAuth } from '../..';
import {
  GROUP_OWNERSHIP_HINT,
  PushoverRequestError,
  pushoverApiCall,
} from '../common';
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
      'Get or create a delivery group by name and return its group key. Pushover allows only one group per name on an account, so this action lists the existing groups first and returns the case-insensitive match with created=false instead of failing; it only creates when the name is unused, returning created=true. Safe to retry: a second call with the same name returns the same group key. Add members afterwards with Add User to Delivery Group.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'Name of the delivery group, for example On-Call Engineers. Matching against existing groups ignores case, and the name is returned exactly as Pushover stores it.',
      required: true,
    }),
  },
  outputSchema: createDeliveryGroupOutputSchema,
  async run({ auth, propsValue }) {
    const existing = await findGroupByName({
      apiToken: auth.props.api_token,
      name: propsValue.name,
    });
    if (existing !== undefined) {
      return {
        group: existing.group,
        name: existing.name,
        created: false,
      };
    }

    try {
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
    } catch (error) {
      if (!isNameAlreadyTakenError(error)) {
        throw error;
      }
      const raced = await findGroupByName({
        apiToken: auth.props.api_token,
        name: propsValue.name,
      });
      if (raced === undefined) {
        throw error;
      }
      return {
        group: raced.group,
        name: raced.name,
        created: false,
      };
    }
  },
});

async function findGroupByName({
  apiToken,
  name,
}: FindGroupByNameParams): Promise<PushoverGroup | undefined> {
  const existingGroups = await pushoverApiCall<GroupsResponse>({
    method: HttpMethod.GET,
    resourceUri: '/groups.json',
    queryParams: { token: apiToken },
    errorHint: GROUP_OWNERSHIP_HINT,
  });
  const wanted = name.trim().toLowerCase();
  return (existingGroups.groups ?? []).find(
    (group) => group.name.trim().toLowerCase() === wanted
  );
}

function isNameAlreadyTakenError(error: unknown): boolean {
  if (error instanceof PushoverRequestError) {
    if (error.status !== undefined && error.status >= 500) {
      return false;
    }
    if (error.vendorErrors.length > 0) {
      return error.vendorErrors.some((entry) => NAME_TAKEN_PATTERN.test(entry));
    }
  }
  const message = error instanceof Error ? error.message : String(error);
  return NAME_TAKEN_PATTERN.test(message);
}

const NAME_TAKEN_PATTERN = /already (exists|been taken|in use)|has already been|must be unique/i;

type PushoverGroup = {
  group: string;
  name: string;
};

type GroupsResponse = {
  groups: PushoverGroup[];
};

type FindGroupByNameParams = {
  apiToken: string;
  name: string;
};

type CreateGroupResponse = {
  group: string;
};
