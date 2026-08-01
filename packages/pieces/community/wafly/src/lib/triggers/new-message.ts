import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { waflyAuth } from '../common';

export const newMessage = createTrigger({
  auth: waflyAuth,
  name: 'new_message',
  displayName: 'New Message Received',
  description:
    'Fires when the instance receives a WhatsApp message — already grouped and with voice notes transcribed.',
  type: TriggerStrategy.WEBHOOK,
  aiMetadata: {
    description:
      'Fires when a connected Wafly WhatsApp instance receives an inbound message. If the message buffer is enabled, consecutive messages from the same person arrive as one event with a "buffered" field; if transcription is enabled, voice notes arrive with their text under "transcription". The payload carries the sender phone, the message body and the instance identifier.',
  },
  props: {},
  sampleData: {
    instanceId: 'my-instance',
    phone: '5511999999999',
    senderName: 'Maria',
    fromMe: false,
    isGroup: false,
    momment: 1754006400000,
    messageId: '3EB0C767D26B8A3B1F2A',
    text: {
      message: 'hi\nyou there?\nhow much is it?',
    },
    buffered: {
      count: 3,
      messageIds: [
        '3EB0C767D26B8A3B1F2A',
        '3EB0C767D26B8A3B1F2B',
        '3EB0C767D26B8A3B1F2C',
      ],
      waitedMs: 8012,
    },
    transcription: {
      status: 'ok',
      text: "I'd like two units, please",
      latency_ms: 1180,
    },
  },
  /**
   * Wafly has no public endpoint to register a webhook URL — it is set in the
   * dashboard, under Instance -> Webhooks. So there is nothing to subscribe or
   * unsubscribe here, and the URL is pasted by hand once. Doing it silently in
   * onEnable would be worse than doing nothing: the flow would look armed and
   * never fire.
   */
  async onEnable(context) {
    // Intentionally empty — see the note above. `context` is kept so the
    // generic parameters stay inferable from this literal.
    void context;
  },
  async onDisable(context) {
    void context;
  },
  async run(context) {
    return [context.payload.body];
  },
});
