import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { coasyAuth } from '../..';
import { createCoasyTrigger, destroyCoasyTrigger } from '../common/triggers';
import { CoasyClient } from '../common/coasyClient';

const triggerName = "NEW_FUNNEL_PARTICIPANT";

export const newFunnelParticipant = createTrigger({
  auth: coasyAuth,
  name: 'newFunnelParticipant',
  displayName: 'New Funnel Participant',
  description: 'Triggers when a new funnel particpant is created',
  props: {
    funnelIds: Property.Array({
      displayName: 'Funnel IDs',
      description: 'IDs of funnel to react to',
      required: false
    })
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  onEnable : (context) => createCoasyTrigger({
    triggerName,
    webhookUrl: context.webhookUrl,
    auth: context.auth,
    filter: context.propsValue,
    store: context.store
  }),
  onDisable : (context) => destroyCoasyTrigger({
    triggerName,
    auth: context.auth,
    store: context.store
  }),
  async run(context) {
    return [context.payload.body];
  }
});
