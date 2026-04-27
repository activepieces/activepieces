import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  savvyCalApiCall,
  buildTeamOptions,
  buildLinkOptions,
  flattenLink,
  SavvyCalSchedulingLink,
} from '../common';
import { savvyCalAuth } from '../../';

export const duplicateSchedulingLinkAction = createAction({
  auth: savvyCalAuth,
  name: 'duplicate_scheduling_link',
  displayName: 'Duplicate Scheduling Link',
  description: 'Creates a copy of an existing scheduling link.',
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
      description: 'Select the scheduling link to duplicate.',
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
    const response = await savvyCalApiCall<SavvyCalSchedulingLink>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/links/${context.propsValue.link_id}/duplicate`,
    });
    return flattenLink(response.body);
  },
});
