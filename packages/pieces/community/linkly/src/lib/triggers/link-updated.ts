import { createLinklyWebhookTrigger, sampleLink } from './webhook-trigger';

export const linkUpdated = createLinklyWebhookTrigger({
  name: 'link_updated',
  displayName: 'Link Updated',
  description: 'Fires when a link\'s settings change. Autosaved edits fire too, so expect several events per editing session.',
  aiDescription:
    'Fires in real time whenever a Linkly link in the selected workspace is updated (destination, name, slug, UTM tags, rules, enabled state). Delivers the full updated link record. Fires on every save, including autosaves, so de-duplicate downstream if needed.',
  event: 'link.updated',
  sampleData: {
    event: 'link.updated',
    timestamp: '2026-09-13T10:31:00Z',
    link: { ...sampleLink, url: 'https://example.com/new-landing-page' },
  },
});
