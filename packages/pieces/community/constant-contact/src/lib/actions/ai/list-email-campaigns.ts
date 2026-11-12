import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { campaignsOutputSchema } from '../../common/output-schemas';

export const listEmailCampaignsAiAction = createAction({
  auth: constantContactAuth,
  name: 'list_email_campaigns_ai',
  classification: 'SEARCH',
  displayName: 'List Email Campaigns',
  description: 'Lists email campaigns, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Constant Contact email campaigns (campaign_id, name, status), optionally by last-updated date range, one page at a time. Use Get Email Campaign for its activity IDs. current_status casing differs between list and get (Draft vs DRAFT), so compare it case-insensitively. Needs the campaign_data permission (reconnect if missing).',
    idempotent: true,
  },
  outputSchema: campaignsOutputSchema,
  props: {
    after_date: aiProps.text({ displayName: 'Updated After', description: 'ISO 8601 date or date-time.' }),
    before_date: aiProps.text({ displayName: 'Updated Before', description: 'ISO 8601 date or date-time.' }),
    limit: aiProps.limit({ max: 500, fallback: 50 }),
    cursor: aiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const page = await ccClient.listPage({
      accessToken: auth.access_token,
      path: '/emails',
      key: 'campaigns',
      operation: 'list email campaigns',
      query: {
        after_date: aiInput.isoDateTime({ value: propsValue.after_date, label: 'Updated After' }),
        before_date: aiInput.isoDateTime({ value: propsValue.before_date, label: 'Updated Before' }),
        limit: aiInput.limit({ value: propsValue.limit, max: 500, fallback: 50 }),
        cursor: aiInput.cursor(propsValue.cursor),
      },
      requiredScope: 'campaign_data',
    });
    return { campaigns: page.items, next_cursor: page.nextCursor };
  },
});
