import { createPipelineWebhookTrigger } from '../common/trigger-factory';

export const boxPipelineChangedTrigger = createPipelineWebhookTrigger({
  name: 'box_pipeline_changed',
  displayName: 'Box Moved to Different Pipeline',
  description:
    'Triggers when a box is moved out of (or into) the selected pipeline.',
  aiMetadata: {
    description:
      'Fires when a box is moved between pipelines relative to the selected pipeline (moved into or out of it), representing a record being reassigned to a different pipeline; the event includes the previous pipeline key.',
  },
  event: 'BOX_CHANGE_PIPELINE',
  sampleData: {
    boxKey: 'agxzfm1haWxmb29nYWVyMQsSA0JveBiAgIDAj-iiCgw',
    name: 'Acme Inc',
    pipelineKey: 'agxzfm1haWxmb29nYWVyMQsSCFBpcGVsaW5lGOyXFAw',
    previousPipelineKey: 'agxzfm1haWxmb29nYWVyMQsSCFBpcGVsaW5lGOyXFAx',
    lastUpdatedTimestamp: 1714080000000,
  },
});
