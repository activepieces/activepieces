import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { coasyAuth } from '../..';
import { createCoasyTrigger, destroyCoasyTrigger, testCoasyTrigger } from '../common/triggers';

const triggerName = "NEW_WEBINAR_PARTICIPANT";

export const newWebinarParticipant = createTrigger({
  auth: coasyAuth,
  name: 'newWebinarParticipant',
  displayName: 'New Webinar Participant',
  description: 'Triggers when a new webinar particpant is created',
  props: {
    webinarIds: Property.Array({
      displayName: 'Webinar IDs',
      description: 'IDs of webinar to react to',
      required: false
    }),
    selectedStartType: Property.StaticDropdown({
      displayName: 'Selected start type',
      description: 'filter only those participants',
      required: false,
      options: {
        options: [{
          label: "Instantly",
          value: "INSTANTLY"
        }, {
          label: "Later",
          value: "LATER"
        }]
      }
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
  test: (context) => testCoasyTrigger({
    triggerName,
    auth: context.auth
  }),
  async run(context) {
    return [context.payload.body];
  }
});
