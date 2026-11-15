import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { getMeActionOutputSchema } from '../../../output-schemas';

export const getMeAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_me',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Gets the monday.com user behind the connected API token.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the profile of the monday.com user who owns the connected API token (ID, name, email, role kind, status, time zone, account). Use to learn "who am I" before assigning items, sending notifications or filtering by the current user. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getMeActionOutputSchema,
  props: {},
  async run(context) {
    const data = await makeClient(context.auth).query<{ me: MondayMe | null }>({
      query: `query {
        me {
          id
          name
          email
          title
          status
          url
          time_zone_identifier
          country_code
          created_at
          user_config { kind }
          photo_url { small }
          account { id name slug }
        }
      }`,
    });

    const me = data.me;
    if (!me) {
      throw new Error('monday.com did not return the current user.');
    }

    return {
      id: me.id,
      name: me.name,
      email: me.email,
      title: me.title ?? null,
      kind: me.user_config?.kind ?? null,
      status: me.status ?? null,
      url: me.url ?? null,
      time_zone: me.time_zone_identifier ?? null,
      country_code: me.country_code ?? null,
      photo_url: me.photo_url?.small ?? null,
      created_at: me.created_at ?? null,
      account_id: me.account?.id ?? null,
      account_name: me.account?.name ?? null,
      account_slug: me.account?.slug ?? null,
    };
  },
});

type MondayMe = {
  id: string;
  name: string;
  email: string;
  title: string | null;
  status: string | null;
  url: string | null;
  time_zone_identifier: string | null;
  country_code: string | null;
  created_at: string | null;
  user_config: { kind: string } | null;
  photo_url: { small: string | null } | null;
  account: { id: string; name: string; slug: string } | null;
};
