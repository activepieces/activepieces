import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import {
  flowluInput,
  flowluOutput,
  flowluSharedProps,
} from '../../common/utils';
import { userListOutputSchema } from '../../output-schemas';

export const listUsersAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'Lists the users in your Flowlu portal.',
  audience: 'both',
  aiMetadata: {
    description:
      "Lists Flowlu portal users (id, name, email login, admin flag) with optional text search, one page at a time with has_more. Use to resolve a person's name or email to the user ID needed for task assignee/owner, opportunity assignee, account owner or project manager. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    search: flowluSharedProps.search(
      'Text to look for in user names and emails, such as "jane". Leave empty to list all.'
    ),
    include_disabled: Property.Checkbox({
      displayName: 'Include Users Without Login',
      description: 'Also return users who are not allowed to log in.',
      required: false,
      defaultValue: false,
    }),
    page: flowluSharedProps.page(),
    limit: flowluSharedProps.limit(),
  },
  outputSchema: userListOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const { page, limit } = flowluInput.pageParams({
      page: props.page,
      limit: props.limit,
    });
    const envelope = await makeClient(context.auth).list<
      Record<string, unknown>
    >('core', 'user', {
      search: flowluInput.optionalText(props.search),
      'filter[role_login]': props.include_disabled ? undefined : 1,
      'order_by[asc][]': 'id',
      page,
      limit,
    });
    const result = flowluOutput.listResult({ envelope, page, limit });
    return { ...result, items: result.items.map(userRow) };
  },
});

function userRow(user: Record<string, unknown>) {
  return {
    id: user['id'] ?? null,
    name: user['name'] ?? null,
    first_name: user['first_name'] ?? null,
    last_name: user['last_name'] ?? null,
    username: user['username'] ?? null,
    position: user['position'] ?? null,
    timezone: user['timezone'] ?? null,
    role_admin: user['role_admin'] ?? null,
    role_login: user['role_login'] ?? null,
    last_active: user['last_active'] ?? null,
  };
}
