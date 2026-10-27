import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const pipelineStageChanged = arteemisEventTrigger({
  name: 'deal_stage_changed',
  event: ARTEEMIS_EVENTS.DEAL_STAGE_CHANGED,
  displayName: 'Pipeline Stage Changed',
  description: 'Triggers when a person enters the pipeline or moves to another stage.',
  aiDescription:
    'Fires when a person enters the pipeline or moves to another stage, with the stage and the contact; two moves within a minute may arrive as one.',
});
