import { createAction, Property } from '@activepieces/pieces-framework';
import { privatusAnalyticsAuth } from '../auth';
import { privatusApiCall, segment } from '../common/client';
import { siteDropdown } from '../common/props';

type Row = { value: string; visits?: number; completions?: number };

export type LiveResponse = {
  live_visitors: number;
  window_minutes: number;
  top_pages?: Row[];
  top_referrers?: Row[];
  top_countries?: Row[];
  top_events?: Row[];
  feed?: Array<Record<string, string | null>>;
};

export async function getLive(token: string, siteId: string, limit: number) {
  return privatusApiCall<LiveResponse>({
    token,
    path: `/sites/${segment(siteId)}/live.json`,
    queryParams: { limit },
  });
}

export const getLiveVisitorsAction = createAction({
  auth: privatusAnalyticsAuth,
  name: 'get_live_visitors',
  classification: 'READ',
  displayName: 'Get Live Visitors',
  description:
    'Gets how many people are on a site right now, with the top pages, referrers and countries of the last 30 minutes.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets what is happening on one website right now: visitors in the last 5 minutes and the top pages, referrers, countries and custom events of the last 30 minutes, plus the latest anonymous hits. Use for real-time checks; use Get Stats for a date range. Read-only; safe to retry.',
    idempotent: true,
  },
  props: {
    site_id: siteDropdown,
    limit: Property.Number({
      displayName: 'Recent Hits',
      description: 'How many of the latest page views and events to include, from 1 to 100.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = Math.min(100, Math.max(1, Math.round(propsValue.limit ?? 10)));
    const data = await getLive(auth.secret_text, propsValue.site_id, limit);
    return {
      site_id: propsValue.site_id,
      live_visitors: data.live_visitors,
      window_minutes: data.window_minutes,
      top_pages: data.top_pages ?? [],
      top_referrers: data.top_referrers ?? [],
      top_countries: data.top_countries ?? [],
      top_events: data.top_events ?? [],
      recent_hits: data.feed ?? [],
    };
  },
});
