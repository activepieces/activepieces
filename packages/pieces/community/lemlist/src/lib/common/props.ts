import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { isRecord, lemlistApiCall } from './client';
import { lemlistAuth } from './constants';

export async function fetchAllCampaigns({ apiKey }: { apiKey: string }): Promise<CampaignSummary[]> {
  const campaigns: CampaignSummary[] = [];
  const seen = new Set<string>();
  for (let page = 0; page < MAX_CAMPAIGN_PAGES; page++) {
    const body = await lemlistApiCall<unknown>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri: '/campaigns',
      query: {
        version: 'v2',
        limit: CAMPAIGN_PAGE_SIZE,
        offset: page * CAMPAIGN_PAGE_SIZE,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
    });
    const items = campaignItems(body);
    let added = 0;
    for (const item of items) {
      const id = typeof item['_id'] === 'string' ? item['_id'] : undefined;
      if (id === undefined || seen.has(id)) {
        continue;
      }
      seen.add(id);
      added++;
      campaigns.push({
        id,
        name: typeof item['name'] === 'string' ? item['name'] : id,
        status: typeof item['status'] === 'string' ? item['status'] : undefined,
      });
    }
    if (items.length < CAMPAIGN_PAGE_SIZE || added === 0) {
      break;
    }
  }
  return campaigns;
}

export function campaignItems(body: unknown): Record<string, unknown>[] {
  const list = Array.isArray(body) ? body : isRecord(body) && Array.isArray(body['campaigns']) ? body['campaigns'] : [];
  return list.filter(isRecord);
}

export const campaignsDropdown = ({
  refreshers,
  required = true,
}: {
  refreshers: string[];
  required?: boolean;
}) =>
  Property.Dropdown({
    auth: lemlistAuth,
    displayName: 'Campaign',
    description: required ? 'Select a campaign' : 'Select a campaign (optional)',
    required,
    refreshers,
    async options({ auth }) {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your Lemlist account first',
          options: [],
        };
      }
      try {
        const campaigns = await fetchAllCampaigns({ apiKey: auth.secret_text });
        return {
          disabled: false,
          options: campaigns.map((campaign) => ({
            label: campaign.status === undefined ? campaign.name : `${campaign.name} (${campaign.status})`,
            value: campaign.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Unable to load campaigns: ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
  });

const CAMPAIGN_PAGE_SIZE = 100;
const MAX_CAMPAIGN_PAGES = 20;

type CampaignSummary = { id: string; name: string; status: string | undefined };
