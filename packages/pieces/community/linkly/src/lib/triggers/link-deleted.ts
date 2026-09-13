import { createLinklyWebhookTrigger, sampleLink } from './webhook-trigger';

export const linkDeleted = createLinklyWebhookTrigger({
  name: 'link_deleted',
  displayName: 'Link Deleted',
  description: 'Fires when a link is deleted. The payload keeps the slug and domain the link had.',
  aiDescription:
    'Fires in real time whenever a Linkly link in the selected workspace is deleted. The link record in the payload retains the id, domain and slug it had before deletion so downstream systems can clean up.',
  event: 'link.deleted',
  sampleData: {
    event: 'link.deleted',
    timestamp: '2026-09-13T10:32:00Z',
    link: sampleLink,
  },
});
