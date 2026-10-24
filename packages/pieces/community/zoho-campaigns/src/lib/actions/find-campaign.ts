import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { zohoCampaignsAuth } from '../auth';
import { zohoCampaignsApi } from '../common/api';
import type {
  ZohoCampaignsCampaignStatus,
  ZohoCampaignsSort,
} from '../common/types';
import { zohoCampaignsFindCampaignOutputSchema } from '../output-schemas';

export const findCampaignAction = createAction({
  auth: zohoCampaignsAuth,
  name: 'findCampaign',
  outputSchema: zohoCampaignsFindCampaignOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Campaign',
  description: 'Locate an existing campaign by campaign name.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches recent campaigns in the account and returns those whose name contains the supplied value (case-insensitive partial match); an empty name effectively returns all campaigns, optionally filtered by status and paginated. Use to resolve a campaign key or browse campaigns. Read-only and idempotent; throws if no campaign matches.',
    idempotent: true,
  },
  props: {
    campaignName: Property.ShortText({
      displayName: 'Campaign Name',
      description:
        'Name of the campaign to be found (partial matches supported)',
      required: true,
    }),
    status: Property.StaticDropdown<ZohoCampaignsCampaignStatus, false>({
      displayName: 'Campaign Status',
      description: 'Filter campaigns by status (optional)',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'all' },
          { label: 'All Campaigns', value: 'all campaigns' },
          { label: 'Drafts', value: 'drafts' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'In Progress', value: 'inprogress' },
          { label: 'Sent', value: 'sent' },
          { label: 'Stopped', value: 'stopped' },
          { label: 'Canceled', value: 'canceled' },
          { label: 'To Be Reviewed', value: 'tobereviewed' },
          { label: 'Reviewed', value: 'reviewed' },
          { label: 'Paused', value: 'paused' },
          { label: 'In Testing', value: 'intesting' },
        ],
      },
    }),
    sort: Property.StaticDropdown<ZohoCampaignsSort, false>({
      displayName: 'Sort Order',
      description: 'Sort order for results (optional)',
      required: false,
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    fromindex: Property.Number({
      displayName: 'From Index',
      description: 'Starting index for pagination (optional, default: 1)',
      required: false,
    }),
    range: Property.Number({
      displayName: 'Range',
      description: 'Number of campaigns to retrieve (optional, default: 5)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, schema);
    const { campaignName, status, sort, fromindex, range } = propsValue;

    const campaigns = await zohoCampaignsApi.listCampaigns({
      auth,
      ...(status && { status }),
      ...(sort && { sort }),
      ...(fromindex && { fromindex }),
      ...(range && { range }),
    });
    const needle = (campaignName ?? '').trim().toLowerCase();

    const matchingCampaigns = campaigns.filter((campaign) =>
      (campaign.campaign_name ?? '').toLowerCase().includes(needle)
    );

    if (matchingCampaigns.length === 0) {
      const statusText = status ? ` with status "${status}"` : '';
      throw new Error(
        `No campaign found with a name containing "${campaignName}"${statusText} in the selected account.`
      );
    }

    return matchingCampaigns;
  },
});

const schema = {
  campaignName: z.string(),
  status: z.optional(
    z.enum([
      'all',
      'all campaigns',
      'drafts',
      'scheduled',
      'inprogress',
      'sent',
      'stopped',
      'canceled',
      'tobereviewed',
      'reviewed',
      'paused',
      'intesting',
    ])
  ),
  sort: z.optional(z.enum(['asc', 'desc'])),
  fromindex: z.optional(z.number().check(z.minimum(1))),
  range: z.optional(z.number().check(z.minimum(1))),
};
