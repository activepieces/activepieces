import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const updatedBoxTrigger = createPipelineWebhookTrigger({
  name: 'updated_box',
  displayName: 'Updated Box',
  description: 'Triggers when a field on a box is updated in the selected pipeline.',
  event: 'BOX_EDIT',
  sampleData: {
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgNCb3gYgICAwI_oogow',
    name: 'Acme Inc',
    pipelineKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgRVc2VyGNwGDAsSCFBpcGVsaW5lGOyXFAw',
    stageKey: '5001',
    lastUpdatedTimestamp: 1714080000000,
  },
});
