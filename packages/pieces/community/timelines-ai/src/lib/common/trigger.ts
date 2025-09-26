import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { timelinesAiAuth } from './auth';
import { AnyWebhookPayload } from './types';

export const createTimelinesAiTrigger = ({
  name,
  displayName,
  description,
  eventType,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: string; 
  sampleData: unknown;
}) => {
  return createTrigger({
    auth: timelinesAiAuth,
    name: name,
    displayName: displayName,
    description: description,
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: sampleData,

    async onEnable(_context) {
      return;
    },

    async onDisable(_context) {
      return;
    },

    async run(context) {
      const payload = context.payload.body as AnyWebhookPayload;
      if (payload.event_type !== eventType) {
        return [];
      }
      if ('account' in payload) {
        return [payload.account];
      } else if ('file' in payload) {
        return [{ ...payload.file, chat: payload.chat }];
      } else if ('message' in payload) {
        return [{ ...payload.message, chat: payload.chat }];
      } else if ('chat' in payload) {
        return [payload.chat];
      }
      return [payload];
    },
  });
};
