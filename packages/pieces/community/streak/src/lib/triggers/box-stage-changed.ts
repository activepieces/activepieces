import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const boxStageChangedTrigger = createPipelineWebhookTrigger({
  name: 'box_stage_changed',
  displayName: 'Box Stage Changed',
  description: 'Triggers when a box moves between stages in the selected pipeline.',
  aiMetadata: {
    description:
      'Fires when a box in the selected pipeline moves from one stage to another, representing progression through the pipeline; the event includes both the new and previous stage keys.',
  },
  event: 'BOX_CHANGE_STAGE',
  sampleData: {
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    name: 'Acme Inc',
    pipelineKey: 'agxzfm1haWxmb29nYWVyMQsSCFBpcGVsaW5lGOyXFAw',
    stageKey: '5002',
    previousStageKey: '5001',
    lastUpdatedTimestamp: 1714080000000,
  },
});
