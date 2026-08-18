import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { PLATFORM_OPTIONS } from '../common/props';

export const getAnalyticsDashboard = createAction({
  auth: tokportalAuth,
  name: 'get_analytics_dashboard',
  displayName: 'Get Analytics Dashboard',
  description: 'Retrieves the workspace analytics dashboard (totals, top accounts, top posts) with optional filters.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read aggregated TokPortal analytics for the workspace (views, likes, followers, top accounts and posts), optionally filtered by platform, country, account IDs and date range. Safe to retry.',
    idempotent: true,
  },
  props: {
    platforms: Property.StaticMultiSelectDropdown({
      displayName: 'Platforms',
      description: 'Only include these platforms.',
      required: false,
      options: { options: PLATFORM_OPTIONS },
    }),
    countries: Property.Array({
      displayName: 'Countries',
      description: 'Only include accounts from these country codes, for example US or FR.',
      required: false,
    }),
    accountIds: Property.Array({
      displayName: 'Account IDs',
      description: 'Only include these delivered account UUIDs.',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      description: 'Start date of the analytics window (YYYY-MM-DD).',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To',
      description: 'End date of the analytics window (YYYY-MM-DD).',
      required: false,
    }),
    workspace: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Workspace UUID (only for multi-workspace API keys).',
      required: false,
    }),
  },
  async run(context) {
    const { platforms, countries, accountIds, from, to, workspace } = context.propsValue;
    const response = await tokportalApiCall<{ data: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/analytics',
      query: {
        platform: platforms,
        country: countries ? countries.map((value) => String(value)) : undefined,
        account: accountIds ? accountIds.map((value) => String(value)) : undefined,
        from,
        to,
        workspace,
      },
    });
    return response.data ?? response;
  },
});
