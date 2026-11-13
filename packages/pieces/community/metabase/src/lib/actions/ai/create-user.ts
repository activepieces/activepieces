import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateUserOutputSchema } from '../../output-schemas';

export const createUserAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_user',
  outputSchema: metabaseCreateUserOutputSchema,
  displayName: 'Create User',
  description: 'Invite a new user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a user and emails them an invite (when email is configured), optionally adding them to groups. Needs an admin key; fails if the email already exists.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    groupIds: Property.Array({
      displayName: 'Group IDs',
      description:
        'Numeric IDs of groups to add the user to, from List Groups. Empty = default group only.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const groupIds = propsValue.groupIds ?? [];
    if (
      !groupIds.every(
        (id): id is number => typeof id === 'number' && Number.isInteger(id)
      )
    ) {
      throw new Error('Group IDs must be a list of numeric IDs.');
    }
    const allUsersGroupIds =
      groupIds.length > 0
        ? (await metabaseApi.listGroups({ auth }))
            .filter((group) => group.magic_group_type === 'all-internal-users')
            .map((group) => group.id)
        : [];
    const memberships = [...new Set([...allUsersGroupIds, ...groupIds])];
    return await metabaseApi.createUser({
      auth,
      body: {
        email: propsValue.email,
        first_name: propsValue.firstName,
        last_name: propsValue.lastName,
        user_group_memberships:
          memberships.length > 0
            ? memberships.map((id) => ({ id }))
            : undefined,
      },
    });
  },
});
