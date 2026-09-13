import { createLinklyWebhookTrigger, sampleLink } from './webhook-trigger';

export const newClick = createLinklyWebhookTrigger({
  name: 'new_click',
  displayName: 'New Click',
  description: 'Fires instantly when any link in the workspace is clicked, with visitor country, platform, browser and referrer.',
  aiDescription:
    'Fires in real time for every click on any Linkly link in the selected workspace. The payload carries the link (id, name, short URL, destination, UTM tags) and the click (id, country, platform, browser, referrer, ISP, bot flag, query parameters). Use to react to traffic as it happens, e.g. notify a channel, update a CRM, or count engagement. IP addresses are never included.',
  event: 'click',
  sampleData: {
    event: 'click',
    timestamp: '2026-09-13T10:30:00Z',
    link: { ...sampleLink, destination: 'https://example.com/landing-page' },
    click: {
      id: '01KYPGEEPJSPR3S564QRBDGA1W',
      country: 'GB',
      is_eu_country: false,
      platform: 'ios',
      browser_name: 'Safari',
      referer: 'https://t.co/',
      isp: 'EE Limited',
      bot_name: null,
      destination: 'https://example.com/landing-page',
      params: { utm_source: 'twitter' },
    },
  },
});
