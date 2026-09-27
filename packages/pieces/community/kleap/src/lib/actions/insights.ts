import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { flattenSubmission, JsonObject, kleapRequest, resolveAppId } from '../common/client';
import { appDropdown } from '../common/props';

export const listFormSubmissions = createAction({
  auth: kleapAuth,
  name: 'list_form_submissions',
  displayName: 'List Form Submissions',
  description: 'Returns the leads sent through the site\'s forms (contact, booking, signup…), newest first.',
  props: {
    app_id: appDropdown(),
    limit: Property.Number({ displayName: 'Limit', description: 'Up to 100.', required: false, defaultValue: 50 }),
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only submissions sent at or after this date.',
      required: false,
    }),
    flatten: Property.Checkbox({
      displayName: 'Flatten Fields',
      description: 'Put the form fields at the top level (plus submission_id, submitted_at, app_id) instead of under "data".',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const since = p.since ? new Date(p.since).toISOString() : undefined;
    const response = await kleapRequest<{ submissions?: JsonObject[] } & JsonObject>(
      context.auth,
      HttpMethod.GET,
      `/apps/${appId}/forms`,
      { query: { limit: Math.min(100, Math.max(1, Number(p.limit ?? 50))), since } },
    );
    const submissions = response.submissions ?? [];
    return {
      app_id: Number(appId),
      count: submissions.length,
      submissions: p.flatten === false ? submissions : submissions.map((s) => flattenSubmission(s, appId)),
    };
  },
});

export const getAnalytics = createAction({
  auth: kleapAuth,
  name: 'get_analytics',
  displayName: 'Get Analytics',
  description: 'Visitors, page views, top pages and sources of the published site.',
  props: {
    app_id: appDropdown(),
    period: Property.StaticDropdown({
      displayName: 'Period',
      required: true,
      defaultValue: '30d',
      options: {
        options: [
          { label: 'Last 7 days', value: '7d' },
          { label: 'Last 30 days', value: '30d' },
          { label: 'Last 90 days', value: '90d' },
        ],
      },
    }),
  },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/analytics`, {
      query: { period: context.propsValue.period || '30d' },
    });
  },
});

export const getSearchConsole = createAction({
  auth: kleapAuth,
  name: 'get_search_console',
  displayName: 'Get Search Console',
  description: 'Google Search Console data for the site: clicks, impressions, queries, indexing.',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/search-console`);
  },
});

export const connectSearchConsole = createAction({
  auth: kleapAuth,
  name: 'connect_search_console',
  displayName: 'Connect Search Console',
  description: 'Connects the published site to Google Search Console (verification + sitemap submission).',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.POST, `/apps/${appId}/search-console/connect`, { timeoutMs: 120_000 });
  },
});

export const getCredits = createAction({
  auth: kleapAuth,
  name: 'get_credits',
  displayName: 'Get Credits',
  description: 'Returns your Kleap credit balance and whether you are on a paid plan.',
  props: {},
  async run(context) {
    return kleapRequest(context.auth, HttpMethod.GET, '/account/credits');
  },
});
