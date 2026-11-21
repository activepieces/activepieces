import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.reachinbox.ai/api/v1/';
const CAMPAIGNS_PAGE_SIZE = 50;
const CAMPAIGNS_MAX_PAGES = 20;

function campaignLabel(campaign: Campaign): string {
  return campaign.status
    ? `${campaign.name} (${campaign.status})`
    : campaign.name;
}

async function fetchEmailAccounts(apiKey: string): Promise<EmailAccount[]> {
  const response = await httpClient.sendRequest<{
    data?: { emailsConnected?: EmailAccount[] };
  }>({
    method: HttpMethod.GET,
    url: `${BASE_URL}account/all`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.body?.data?.emailsConnected ?? [];
}

function webhookInstructions(eventName: string): string {
  return `1. In ReachInbox, open **Profile** → **Settings** → **Integrations** → **Webhooks** and click **Add Webhook**.
2. Paste this URL into **Webhook URL**:
\`\`\`text
{{webhookUrl}}
\`\`\`
3. Choose the **${eventName}** event and save.
4. Click **Test Trigger** here to load a sample event.`;
}

export const fetchCampaigns = async (auth: string): Promise<Campaign[]> => {
  try {
    const campaigns: Campaign[] = [];
    const seenIds = new Set<number>();
    let offset = 0;

    for (let page = 0; page < CAMPAIGNS_MAX_PAGES; page++) {
      const response = await httpClient.sendRequest<{
        data?: { rows?: Campaign[]; totalCount?: number };
      }>({
        method: HttpMethod.GET,
        url: `${BASE_URL}campaigns/all?sort=newest&offset=${offset}&limit=${CAMPAIGNS_PAGE_SIZE}`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });

      const rows = response.body?.data?.rows ?? [];
      const totalCount = response.body?.data?.totalCount;
      const newRows = rows.filter((row) => !seenIds.has(row.id));
      newRows.forEach((row) => seenIds.add(row.id));
      campaigns.push(...newRows);
      offset += rows.length;

      const reachedEnd =
        rows.length < CAMPAIGNS_PAGE_SIZE ||
        (typeof totalCount === 'number' && offset >= totalCount) ||
        newRows.length === 0;
      if (reachedEnd) {
        break;
      }
    }

    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to fetch campaigns.');
  }
};

export const addLeadsToCampaign = async (
  auth: string,
  body: AddLeadsRequestBody
): Promise<AddLeadsResponse> => {
  try {
    const response = await httpClient.sendRequest<AddLeadsResponse>({
      method: HttpMethod.POST,
      url: 'https://api.reachinbox.ai/api/v1/leads/add',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth}`,
      },
      body,
    });

    return response.body;
  } catch (error) {
    console.error('Error adding leads:', error);
    throw new Error('Failed to add leads to campaign.');
  }
};

export const reachinboxCommon = {
  baseUrl: BASE_URL,
  campaignLabel,
  fetchEmailAccounts,
  webhookInstructions,
};

export interface Campaign {
  id: number;
  name: string;
  coreVariables: string[];
  dailyLimit: number;
  mailsSentToday: number;
  accountsToUse: string[];
  tracking: boolean;
  linkTracking: boolean;
  isActive: boolean;
  hasStarted: boolean;
  lastEmailUsed: number;
  delay: number;
  randomDelay: number;
  stopOnReply: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  sent: number;
  totalOpens: string | null;
  totalUniqueOpen: string;
  totalReplies: string;
  emails: {
    sent: number;
    totalOpens: number;
    totalReplies: number;
  };
  status: string;
}

// Define the structure for adding leads
export interface AddLeadsRequestBody {
  campaignId: string;
  leads: {
    email: string;
    firstName: string;
    lastName?: string;
  }[];
  newCoreVariables: string[];
  duplicates: any[];
}

// Define the response structure for adding leads
export interface AddLeadsResponse {
  success: boolean;
  message: string;
  leadCount: number;
}

export type EmailAccount = {
  id: number;
  email: string;
  warmupEnabled: boolean;
  isDisconnected: boolean;
};
