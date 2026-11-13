import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId } from '../common/props';
import { sentCampaignOutputSchema } from '../output-schemas';

export const newCampaignSentTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'new_campaign_sent',
  classification: 'READ',
  displayName: 'New Campaign Sent',
  description: 'Triggers when a client sends a new campaign.',
  aiMetadata: {
    description:
      'Fires once for each campaign that a Campaign Monitor client sends, detected by polling the client sent campaigns (newest first) for campaign IDs not seen before, and returns the campaign name, subject, sender, sent date, recipient count and web version links.',
  },
  props: {
    clientId: clientId,
  },
  type: TriggerStrategy.POLLING,
  outputSchema: sentCampaignOutputSchema,
  sampleData: {
    CampaignID: 'a4ba8e44cd0d82e5a9a703affc2572c2',
    Name: 'October Newsletter',
    Subject: 'Our October news',
    FromName: 'Acme',
    FromEmail: 'news@example.com',
    ReplyTo: 'news@example.com',
    SentDate: '2026-10-20 09:30:00',
    TotalRecipients: 1250,
    WebVersionURL: 'https://example.createsend1.com/t/ViewEmail/r/ABC/',
    WebVersionTextURL: 'https://example.createsend1.com/t/ViewEmail/r/ABC/t',
    Tags: [],
  },
  async onEnable(context) {
    if (context.isRepublish && (await context.store.get(STORE_KEY))) {
      return;
    }
    const campaigns = await fetchRecentCampaigns({
      apiKey: context.auth.secret_text,
      clientId: context.propsValue.clientId,
      seen: new Set<string>(),
      maxPages: 1,
    });
    await context.store.put<string[]>(
      STORE_KEY,
      campaigns.map((campaign) => campaign.CampaignID)
    );
  },
  async onDisable() {
    return;
  },
  async test(context) {
    const campaigns = await fetchRecentCampaigns({
      apiKey: context.auth.secret_text,
      clientId: context.propsValue.clientId,
      seen: new Set<string>(),
      maxPages: 1,
    });
    return campaigns.slice(0, 5);
  },
  async run(context) {
    const stored = (await context.store.get<string[]>(STORE_KEY)) ?? [];
    const seen = new Set(stored);
    const campaigns = await fetchRecentCampaigns({
      apiKey: context.auth.secret_text,
      clientId: context.propsValue.clientId,
      seen,
    });
    const newCampaigns = campaigns.filter(
      (campaign) => !seen.has(campaign.CampaignID)
    );
    const updated = [
      ...newCampaigns.map((campaign) => campaign.CampaignID),
      ...stored,
    ].slice(0, MAX_STORED_IDS);
    await context.store.put<string[]>(STORE_KEY, updated);
    return newCampaigns.reverse();
  },
});

const STORE_KEY = 'seen_sent_campaigns';
const PAGE_SIZE = 100;
const MAX_STORED_IDS = 1000;

async function fetchRecentCampaigns({
  apiKey,
  clientId,
  seen,
  maxPages,
}: {
  apiKey: string;
  clientId: string;
  seen: Set<string>;
  maxPages?: number;
}) {
  const campaigns: SentCampaign[] = [];
  for (let page = 1; maxPages === undefined || page <= maxPages; page++) {
    const response = await makeRequest<{
      Results?: SentCampaign[];
      NumberOfPages?: number;
    }>({
      auth: { apiKey },
      method: HttpMethod.GET,
      path: `/clients/${clientId}/campaigns.json?page=${page}&pagesize=${PAGE_SIZE}&orderdirection=desc`,
    });
    const results = response.body.Results ?? [];
    campaigns.push(...results);
    const reachedSeen = results.some((campaign) =>
      seen.has(campaign.CampaignID)
    );
    if (reachedSeen || page >= (response.body.NumberOfPages ?? 1)) {
      break;
    }
  }
  return campaigns;
}

type SentCampaign = {
  CampaignID: string;
  Name: string;
  SentDate: string;
};
