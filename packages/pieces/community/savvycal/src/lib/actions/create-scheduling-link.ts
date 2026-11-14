import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, buildTeamSlugOptions, flattenLink, LINK_USAGE_OPTIONS, SavvyCalSchedulingLink } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const createSchedulingLinkAction = createAction({
  auth: savvyCalAuth,
  name: 'create_scheduling_link',
  classification: 'WRITE',
  displayName: 'Create Scheduling Link',
  description: 'Creates a new scheduling link, personal or for a team.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new SavvyCal scheduling link in the personal scope or in a team, with a name and optional private name, description, URL slug, and usage (multi-use or single-use). Use to set up a fresh booking page, for example a single-use link for one person. Returns the new link with its id. Not idempotent — each call creates another link.', idempotent: false },
  props: {
    team_slug: Property.Dropdown({
      auth: savvyCalAuth,
      displayName: 'Team',
      description: 'Where to create the link. A team appears here once it has at least one scheduling link.',
      refreshers: [],
      required: true,
      defaultValue: 'personal',
      options: async ({ auth }) => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        try {
          const options = await buildTeamSlugOptions(getToken(auth));
          return { disabled: false, options };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load teams.' };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The public name of the link, shown to the people who book.',
      required: true,
    }),
    private_name: Property.ShortText({
      displayName: 'Private Name',
      description: 'A name only you and your team see, to tell similar links apart.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The short description shown on the booking page.',
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'URL Slug',
      description: 'The end of the link address, for example "intro-call". Letters, numbers, and dashes only. Leave empty for a random one.',
      required: false,
    }),
    usage: Property.StaticDropdown({
      displayName: 'Usage',
      description: 'A single-use link stops taking bookings after the first one.',
      required: false,
      defaultValue: 'recurring',
      options: {
        options: LINK_USAGE_OPTIONS,
      },
    }),
  },
  async run(context) {
    const { team_slug, name, private_name, description, slug, usage } = context.propsValue;
    const response = await savvyCalApiCall<SavvyCalSchedulingLink>({
      token: getToken(context.auth),
      method: HttpMethod.POST,
      path: `/scopes/${encodeURIComponent(team_slug)}/links`,
      body: {
        name,
        ...(private_name ? { private_name } : {}),
        ...(description ? { description } : {}),
        ...(slug ? { slug } : {}),
        ...(usage ? { type: usage } : {}),
      },
    });
    return flattenLink(response.body);
  },
});
