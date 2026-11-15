import { createAction } from '@activepieces/pieces-framework';
import { mondayAuth } from '../../../auth';
import { makeClient } from '../../../common';
import { getAccountActionOutputSchema } from '../../../output-schemas';

export const getAccountAction = createAction({
  auth: mondayAuth,
  name: 'monday_get_account',
  classification: 'READ',
  displayName: 'Get Account',
  description: 'Gets details of the connected monday.com account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return the connected monday.com account: ID, name, slug, tier, plan, trial state, active member count, first day of week and active products. Use to check plan limits or account settings before relying on a plan-gated feature. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getAccountActionOutputSchema,
  props: {},
  async run(context) {
    const data = await makeClient(context.auth).query<{ account: MondayAccount | null }>({
      query: `query {
        account {
          id
          name
          slug
          tier
          country_code
          active_members_count
          first_day_of_the_week
          is_during_trial
          is_trial_expired
          show_timeline_weekends
          plan { tier period max_users version }
          products { id kind tier }
        }
      }`,
    });

    const account = data.account;
    if (!account) {
      throw new Error('monday.com did not return the account.');
    }

    return {
      id: account.id,
      name: account.name,
      slug: account.slug,
      tier: account.tier ?? null,
      country_code: account.country_code ?? null,
      active_members_count: account.active_members_count ?? null,
      first_day_of_the_week: account.first_day_of_the_week ?? null,
      is_during_trial: account.is_during_trial ?? null,
      is_trial_expired: account.is_trial_expired ?? null,
      show_timeline_weekends: account.show_timeline_weekends ?? null,
      plan_tier: account.plan?.tier ?? null,
      plan_period: account.plan?.period ?? null,
      plan_max_users: account.plan?.max_users ?? null,
      plan_version: account.plan?.version ?? null,
      products: (account.products ?? []).map((p) => [p.kind, p.tier].filter(Boolean).join(':')).join(', ') || null,
    };
  },
});

type MondayAccount = {
  id: string;
  name: string;
  slug: string;
  tier: string | null;
  country_code: string | null;
  active_members_count: number | null;
  first_day_of_the_week: string | null;
  is_during_trial: boolean | null;
  is_trial_expired: boolean | null;
  show_timeline_weekends: boolean | null;
  plan: { tier: string | null; period: string | null; max_users: number | null; version: number | null } | null;
  products: { id: string; kind: string | null; tier: string | null }[] | null;
};
