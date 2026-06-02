import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const newBoxTrigger = createPipelineWebhookTrigger({
  name: 'new_box',
  displayName: 'New Box',
  description: 'Triggers when a new box is created in the selected pipeline.',
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
