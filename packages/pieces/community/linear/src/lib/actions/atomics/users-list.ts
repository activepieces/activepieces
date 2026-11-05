import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicProps, LinearUserNode } from './common';
import { USERS_LIST_QUERY } from './queries';
import { atomicUsersPageOutputSchema } from './output-schemas';

export const linearUsersListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_users_list',
  classification: 'SEARCH',
  displayName: 'List Users (AI)',
  description: 'List workspace members, optionally find one by email or name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists members of the Linear workspace with ID, name, email and role flags, optionally matching an exact email (case-insensitive) or a name fragment. Use to turn a person\'s email or name into the Assignee ID other actions need; use Get Current User for the key owner. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Exact email address to look up, for example jane@acme.com.', required: false }),
    name_contains: Property.ShortText({ displayName: 'Name Contains', description: 'Only users whose name contains this text (case-insensitive).', required: false }),
    include_disabled: Property.Checkbox({ displayName: 'Include Deactivated Users', required: false, defaultValue: false }),
    limit: atomicProps.limitProp({ fallback: 100, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicUsersPageOutputSchema,
  async run({ auth, propsValue }) {
    const email = propsValue.email?.trim();
    const nameContains = propsValue.name_contains?.trim();
    const filter = linearGraphql.definedOnly({
      email: email ? { eqIgnoreCase: email } : undefined,
      name: nameContains ? { containsIgnoreCase: nameContains } : undefined,
    });
    const data = await linearGraphql.request<{ users: LinearConnection<LinearUserNode> }>({
      auth,
      query: USERS_LIST_QUERY,
      variables: {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        includeDisabled: propsValue.include_disabled === true,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 100, max: 250 }),
        after: propsValue.cursor || undefined,
      },
    });
    return linearMappers.toPage({ connection: data.users, map: atomicMappers.flattenUser });
  },
});
