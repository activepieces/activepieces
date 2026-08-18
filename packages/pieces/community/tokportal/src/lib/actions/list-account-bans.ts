import { createAction, Property } from '@activepieces/pieces-framework';
import { tokportalAuth } from '../auth';
import { tokportalPaginatedApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const listAccountBans = createAction({
  auth: tokportalAuth,
  name: 'list_account_bans',
  displayName: 'List Account Bans',
  description:
    'Lists validated ban reports and appeals for your delivered accounts (appeal pending, accepted, refused, staff resolution).',
  audience: 'both',
  aiMetadata: {
    description:
      'List TokPortal ban reports for delivered accounts across the appeal and resolution lifecycle. Use Since as a polling watermark; for real-time use the Account Banned trigger. Safe to retry.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter by appeal lifecycle status.',
      required: false,
      options: {
        options: [
          { label: 'Appeal Pending', value: 'appeal_pending' },
          { label: 'Appeal Accepted', value: 'appeal_accepted' },
          { label: 'Appeal Refused', value: 'appeal_refused' },
          { label: 'No Appeal, Banned', value: 'no_appeal_banned' },
        ],
      },
    }),
    resolution: Property.StaticDropdown({
      displayName: 'Resolution',
      description: 'Filter by staff commercial resolution. pending selects confirmed bans awaiting the staff decision.',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Refund', value: 'refund' },
          { label: 'Remake', value: 'remake' },
          { label: 'No Remake', value: 'no_remake' },
        ],
      },
    }),
    accountId: tokportalProps.accountId(false),
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only reports updated at or after this timestamp. Use the highest updated_at you have seen as a polling watermark.',
      required: false,
    }),
    includeScreenshots: Property.Checkbox({
      displayName: 'Include Screenshots',
      description: 'Include a signed 7-day URL of the ban-evidence screenshot when one exists.',
      required: false,
    }),
    maxResults: tokportalProps.maxResults(),
  },
  async run(context) {
    const { status, resolution, accountId, since, includeScreenshots, maxResults } = context.propsValue;
    return await tokportalPaginatedApiCall({
      apiKey: context.auth.secret_text,
      resourceUri: '/account-bans',
      query: {
        status,
        resolution,
        account_id: accountId,
        since,
        include_screenshots: includeScreenshots === undefined ? undefined : String(includeScreenshots),
      },
      maxResults: maxResults ?? undefined,
    });
  },
});
