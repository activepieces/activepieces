import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const newBoxTrigger = createPipelineWebhookTrigger({
  name: 'new_box',
  displayName: 'New Box',
  description: 'Triggers when a new box is created in the selected pipeline.',
  aiMetadata: {
    description:
      'Fires when a new box (CRM record such as a deal or lead) is created in the selected Streak pipeline, representing a freshly added record.',
  },
  event: 'BOX_CREATE',
  sampleData: {
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgRVc2VyGNwGDAsSA0JveBiAgIDAj-iiCgw',
    name: 'Acme Inc',
    pipelineKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgRVc2VyGNwGDAsSCFBpcGVsaW5lGOyXFAw',
    stageKey: '5001',
    creatorKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgRVc2VyGNwGDA',
    creationTimestamp: 1714080000000,
    lastUpdatedTimestamp: 1714080000000,
  },
});
