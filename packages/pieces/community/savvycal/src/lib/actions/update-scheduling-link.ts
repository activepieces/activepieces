import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  savvyCalApiCall,
  buildTeamOptions,
  buildLinkOptions,
  flattenLink,
  LINK_USAGE_OPTIONS,
  SavvyCalSchedulingLink,
} from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const updateSchedulingLinkAction = createAction({
  auth: savvyCalAuth,
  name: 'update_scheduling_link',
  classification: 'WRITE',
  displayName: 'Update Scheduling Link',
  description: 'Changes the name, description, URL slug, or usage of a scheduling link.',
  audience: 'both',
  aiMetadata: { description: 'Updates a SavvyCal scheduling link identified by its link id: its public name, private name, description, URL slug, or usage (multi-use or single-use; group links cannot be single-use). Only the fields provided are changed. Idempotent — repeating the call with the same values leaves the link unchanged.', idempotent: true },
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
      description: 'Select the scheduling link to update.',
      refreshers: ['team_id'],
      required: true,
      options: async ({ auth, team_id }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildLinkOptions(getToken(auth), team_id);
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load scheduling links.' };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new public name of the link. Leave empty to keep the current one.',
      required: false,
    }),
    private_name: Property.ShortText({
      displayName: 'Private Name',
      description: 'The new private name. Leave empty to keep the current one.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description shown on the booking page. Leave empty to keep the current one.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'URL Slug',
      description: 'The new end of the link address. Letters, numbers, and dashes only. Leave empty to keep the current one. Changing it breaks the old address.',
      required: false,
    }),
    usage: Property.StaticDropdown({
      displayName: 'Usage',
      description: 'Leave empty to keep the current usage. Group links cannot be single-use.',
      required: false,
      options: {
        options: LINK_USAGE_OPTIONS,
      },
    }),
  },
  async run(context) {
    const { link_id, name, private_name, description, slug, usage } = context.propsValue;
    const response = await savvyCalApiCall<SavvyCalSchedulingLink>({
      token: getToken(context.auth),
      method: HttpMethod.PATCH,
      path: `/links/${link_id}`,
      body: {
        ...(name ? { name } : {}),
        ...(private_name ? { private_name } : {}),
        ...(description ? { description } : {}),
        ...(slug ? { slug } : {}),
        ...(usage ? { type: usage } : {}),
      },
    });
    return flattenLink(response.body);
  },
});
