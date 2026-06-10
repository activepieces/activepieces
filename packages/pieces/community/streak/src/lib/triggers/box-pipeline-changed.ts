import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const boxPipelineChangedTrigger = createPipelineWebhookTrigger({
  name: 'box_pipeline_changed',
  displayName: 'Box Moved to Different Pipeline',
  description:
    'Triggers when a box is moved out of (or into) the selected pipeline.',
  event: 'BOX_CHANGE_PIPELINE',
  sampleData: {
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    name: 'Acme Inc',
    pipelineKey: 'agxzfm1haWxmb29nYWVyMQsSCFBpcGVsaW5lGOyXFAw',
    previousPipelineKey: 'agxzfm1haWxmb29nYWVyMQsSCFBpcGVsaW5lGOyXFAx',
    lastUpdatedTimestamp: 1714080000000,
  },
});
