export const reachinboxCommon = {
  baseUrl: 'https://api.reachinbox.ai/api/v1/',
};

import { HttpMethod, httpClient } from '@activepieces/pieces-common';

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

// Fetch campaigns from the ReachInbox API
export const fetchCampaigns = async (auth: string): Promise<Campaign[]> => {
  try {
    const response = await httpClient.sendRequest<any>({
      method: HttpMethod.GET,
      url: 'https://api.reachinbox.ai/api/v1/campaigns/all?sort=newest&offset=0&limit=50',
      headers: {
        Authorization: `Bearer ${auth}`,
      },
    });

    return response.body?.data?.rows || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to fetch campaigns.');
  }
};

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

// Add leads to a campaign
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
