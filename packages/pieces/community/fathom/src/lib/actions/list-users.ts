import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomClient } from '../common/client';
import { fathomInputs } from '../common/props';
import { fathomOutputSchemas } from '../output-schemas';

export const listUsers = createAction({
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'List Users and Permissions',
  description: 'List the users of your Fathom account with their status and permissions. Needs an account admin connection.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists users of the Fathom account with status and their settings and view permissions, one page per call with a cursor, optionally filtered by team, status or admin level. Requires the connected user to be an account admin (403 otherwise); the invited status cannot be combined with an admin level filter. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    team: Property.ShortText({ displayName: 'Team', description: 'Exact team name to filter by (see Find Team).', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Deactivated', value: 'deactivated' },
          { label: 'Invited', value: 'invited' },
        ],
      },
    }),
    settings_access: Property.StaticDropdown({
      displayName: 'Admin Level',
      description: 'Filter by settings access. Not available together with Status = Invited.',
      required: false,
      options: {
        options: [
          { label: 'None', value: 'none' },
          { label: 'Team Admin', value: 'team_admin' },
          { label: 'Account Admin', value: 'account_admin' },
        ],
      },
    }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from the previous call.', required: false }),
  },
  outputSchema: fathomOutputSchemas.users,
  async run({ auth, propsValue }) {
    const status = fathomInputs.optionalText({ value: propsValue.status });
    const settingsAccess = fathomInputs.optionalText({ value: propsValue.settings_access });
    if (status === 'invited' && settingsAccess !== undefined) {
      throw new Error('Fathom cannot filter invited users by admin level. Clear Admin Level or pick another status.');
    }
    const page = await fathomClient.listPage({
      auth,
      path: 'users',
      query: {
        team: fathomInputs.optionalText({ value: propsValue.team }),
        status,
        settings_access: settingsAccess,
        cursor: fathomInputs.optionalText({ value: propsValue.cursor }),
      },
    });
    return { items: page.items, next_cursor: page.next_cursor, has_more: page.next_cursor !== null };
  },
});
