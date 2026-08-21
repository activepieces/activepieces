import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import { famulorRequest, flattenCampaign, unwrapList, unwrapTotal } from '../common/client';

export const listCampaigns = createAction({
  auth: famulorAuth,
  name: 'listCampaigns',
  displayName: 'List Campaigns',
  description: 'List outreach campaigns in the workspace.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List Famulor outreach campaigns, optionally filtered by status. Use this to discover campaign UUIDs; use Create Campaign to add one. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return campaigns with this status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Running', value: 'running' },
          { label: 'Paused', value: 'paused' },
          { label: 'Completed', value: 'completed' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of campaigns to return (1–200, default 50)',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of campaigns to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.status) {
      queryParams['status'] = String(propsValue.status);
    }
    if (propsValue.limit !== undefined && propsValue.limit !== null) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.offset !== undefined && propsValue.offset !== null) {
      queryParams['offset'] = String(propsValue.offset);
    }

    const body = await famulorRequest({
      auth,
      method: HttpMethod.GET,
      path: '/campaigns',
      queryParams,
    });

    const rows = unwrapList(body, ['campaigns', 'data', 'rows']).map((campaign) =>
      flattenCampaign(campaign),
    );
    return {
      total: unwrapTotal(body) ?? rows.length,
      rows,
    };
  },
});
