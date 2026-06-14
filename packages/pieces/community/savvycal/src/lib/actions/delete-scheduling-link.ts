import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, buildTeamOptions, buildLinkOptions } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const deleteSchedulingLinkAction = createAction({
  auth: savvyCalAuth,
  name: 'delete_scheduling_link',
  displayName: 'Delete Scheduling Link',
  description: 'Permanently deletes a scheduling link from your SavvyCal account.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a scheduling link by its id; this cannot be undone. Use only when a link should be fully removed. The first call deletes the link and subsequent calls for the same id will fail, so treat it as a destructive, non-idempotent mutation.', idempotent: false },
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
    link_id: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Scheduling Link',
      description: 'Select the scheduling link to delete. This action cannot be undone.',
      refreshers: ['team_id'],
      required: true,
      options: async ({ auth, team_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildLinkOptions(getToken(auth), team_id as string | null);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
  },
  async run(context) {
    await savvyCalApiCall({
      token: getToken(context.auth),
      method: HttpMethod.DELETE,
      path: `/links/${context.propsValue.link_id}`,
    });
    return {
      success: true,
      link_id: context.propsValue.link_id,
      message: 'Scheduling link deleted successfully.',
    };
  },
});
