import { sampleLead, samplePost } from '../common';
import { hookTrigger } from './hook-trigger';

export const newLead = hookTrigger({
  name: 'new_lead',
  event: 'lead.created',
  displayName: 'New Lead',
  description: 'Triggers when a new lead arrives in TruLata, from any form, call or source.',
  sampleData: sampleLead,
});

export const leadStatusChanged = hookTrigger({
  name: 'lead_status_changed',
  event: 'lead.status_changed',
  displayName: 'Lead Status Changed',
  description: 'Triggers when a lead is marked contacted, quoted, won, lost or not a lead.',
  sampleData: { ...sampleLead, status: 'won', status_note: 'Signed the quote' },
});

export const newPost = hookTrigger({
  name: 'new_post',
  event: 'post.published',
  displayName: 'New Blog Post Published',
  description: 'Triggers when TruLata publishes a new blog post.',
  sampleData: samplePost,
});
