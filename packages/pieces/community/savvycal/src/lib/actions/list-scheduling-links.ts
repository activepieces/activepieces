import { createAction, Property } from '@activepieces/pieces-framework';
import { savvyCalPaginatedCall, buildTeamOptions, flattenLink, SavvyCalSchedulingLink } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const listSchedulingLinksAction = createAction({
  auth: savvyCalAuth,
  name: 'list_scheduling_links',
  displayName: 'List Scheduling Links',
  description: 'Returns all scheduling links configured in your SavvyCal account.',
  audience: 'both',
  aiMetadata: { description: 'Lists the scheduling links in the account, optionally filtered to a single team (or to personal links). Use to discover available links and their ids before booking, querying slots, or managing a link. Read-only and idempotent.', idempotent: true },
  props: {
    team_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Team',
      description: 'Filter scheduling links by team. Leave empty to show all teams.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildTeamOptions(getToken(auth));
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
        }
      },
    }),
  },
  async run(context) {
    const links = await savvyCalPaginatedCall<SavvyCalSchedulingLink>({
      token: getToken(context.auth),
      path: '/links',
    });

    const { team_id } = context.propsValue;
    const filtered = team_id
      ? team_id === 'personal'
        ? links.filter((l) => l.scope === null)
        : links.filter((l) => l.scope?.id === team_id)
      : links;

    return filtered.map(flattenLink);
  },
});
