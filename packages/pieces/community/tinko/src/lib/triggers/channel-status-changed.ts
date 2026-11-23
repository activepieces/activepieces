import { tinkoEvents } from '../common/events';
import { tinkoSamples } from '../common/samples';
import { createTinkoWebhookTrigger } from '../common/webhook';

export const channelStatusChangedTrigger = createTinkoWebhookTrigger({
  name: 'channel_status_changed',
  displayName: 'Channel Connected or Disconnected',
  description: 'Triggers when a channel connects or loses its connection.',
  aiMetadata: {
    description:
      'Fires once when a Tinko channel (for example a WhatsApp number) connects or disconnects. The connected field is true for a connection and false for a disconnection. Use it to alert the team when a number goes offline.',
  },
  events: ['CHANNEL_CONNECTED', 'CHANNEL_DISCONNECTED'],
  filterChannelsOnServer: false,
  sampleData: tinkoSamples.channelStatusChanged,
  mapEvent: tinkoEvents.channelStatus,
});
