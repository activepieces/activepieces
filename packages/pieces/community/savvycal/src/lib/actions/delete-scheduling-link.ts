import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, buildTeamOptions, buildLinkOptions } from '../common';
import { savvyCalAuth } from '../../';

export const deleteSchedulingLinkAction = createAction({
  auth: savvyCalAuth,
  name: 'delete_scheduling_link',
  displayName: 'Delete Scheduling Link',
  description: 'Permanently deletes a scheduling link from your SavvyCal account.',
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
          const options = await buildTeamOptions(auth.secret_text);
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
          const options = await buildLinkOptions(auth.secret_text, team_id as string | null);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
  },
  async run(context) {
    await savvyCalApiCall({
      token: context.auth.secret_text,
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
