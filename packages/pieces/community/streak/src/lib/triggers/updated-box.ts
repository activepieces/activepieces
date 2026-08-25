import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const updatedBoxTrigger = createPipelineWebhookTrigger({
  name: 'updated_box',
  displayName: 'Updated Box',
  description: 'Triggers when a field on a box is updated in the selected pipeline.',
  aiMetadata: {
    description:
      'Fires when any field on an existing box in the selected pipeline is edited, representing a change to a CRM record. Note this fires on general edits, while separate triggers cover stage changes and pipeline moves.',
  },
  event: 'BOX_EDIT',
  sampleData: {
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgNCb3gYgICAwI_oogow',
    name: 'Acme Inc',
    pipelineKey: 'agxzfm1haWxmb29nYWVyMQsSDE9yZ2FuaXphdGlvbiIHc3RyZWFrMAwLEgRVc2VyGNwGDAsSCFBpcGVsaW5lGOyXFAw',
    stageKey: '5001',
    lastUpdatedTimestamp: 1714080000000,
  },
});
