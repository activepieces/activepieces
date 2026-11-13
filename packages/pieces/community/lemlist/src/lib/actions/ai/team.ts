import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { lemlistApiCall } from '../../common/client';
import { lemlistAuth } from '../../common/constants';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

export const getTeamAction = createAction({
  auth: lemlistAuth,
  name: 'get_team',
  classification: 'READ',
  displayName: 'Get Team',
  description: 'Returns the lemlist team of the connected API key, with its users.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the lemlist team linked to this connection: team ID, name and its users (userId, name, email, role). Use to find user IDs for tasks, sender filters or Send Inbox Email. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: lemlistSchemas.team,
  async run({ auth }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/team',
      query: { version: 'v2' },
    });
  },
});

export const listTeamSendersAction = createAction({
  auth: lemlistAuth,
  name: 'list_team_senders',
  classification: 'SEARCH',
  displayName: 'List Team Senders',
  description: 'Lists team members and the campaigns they send from.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every lemlist team member (userId) with the campaigns they send from (campaign ID, name, status). Optional campaign state filter. Returns all senders in one call. Read-only.',
    idempotent: true,
  },
  props: {
    state: Property.StaticDropdown({
      displayName: 'Campaign State',
      description: 'Only include campaigns in this state.',
      required: false,
      options: {
        disabled: false,
        options: ['running', 'paused', 'draft', 'ended', 'archived', 'errors'].map((value) => ({
          label: value,
          value,
        })),
      },
    }),
  },
  outputSchema: lemlistSchemas.senders,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/team/senders',
      query: { state: propsValue.state ?? undefined },
    });
    const items = lemlistResults.listFrom({ body });
    return { items, count: items.length, offset: 0, has_more: false };
  },
});

export const getTeamCreditsAction = createAction({
  auth: lemlistAuth,
  name: 'get_team_credits',
  classification: 'READ',
  displayName: 'Get Team Credits',
  description: 'Returns the remaining lemlist credits of the team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns how many lemlist credits the team has left (total plus subscription, paid, gifted and freemium breakdown). Check before credit-spending actions such as Enrich Lead. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: lemlistSchemas.credits,
  async run({ auth }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/team/credits',
    });
  },
});
