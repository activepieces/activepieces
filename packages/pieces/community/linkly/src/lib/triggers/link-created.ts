import { createLinklyWebhookTrigger, sampleLink } from './webhook-trigger';

export const linkCreated = createLinklyWebhookTrigger({
  name: 'link_created',
  displayName: 'New Link',
  description: 'Fires when a short link is created in the workspace, from the dashboard, the API or any integration.',
  aiDescription:
    'Fires in real time whenever a new Linkly link is created in the selected workspace, delivering the full link record (id, name, short URL, destination, domain, slug, UTM tags, rules). Use to sync new links to a sheet, CMS or CRM.',
  event: 'link.created',
  sampleData: {
    event: 'link.created',
    timestamp: '2026-09-13T10:30:00Z',
    link: sampleLink,
  },
});
