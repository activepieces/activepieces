import { Property } from '@activepieces/pieces-framework';

export const aiProps = { leadId, campaignId, leadsListId };

function leadId() {
  return Property.ShortText({
    displayName: 'Lead ID',
    description: 'Numeric Hunter lead ID, e.g. from Search Leads or Create Lead (field id).',
    required: true,
  });
}

function campaignId() {
  return Property.ShortText({
    displayName: 'Campaign ID',
    description: 'Numeric Hunter campaign (sequence) ID from List Campaigns (field id).',
    required: true,
  });
}

function leadsListId() {
  return Property.ShortText({
    displayName: 'Leads List ID',
    description: 'Numeric Hunter leads list ID from List Leads Lists (field id).',
    required: true,
  });
}
