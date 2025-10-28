import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { uscreenAuth } from '../common/auth';
import { uscreenProps } from '../common/props';

const sampleData = {
  id: '   123456',
  email: 'john.doe@example.com',
  changes: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    subscription_status: 'active',
    lifetime_spent: '100',
    bounced_email: false,
    status: 'active',
    field_1: 'value_1',
    field_2: 'value_2',
    field_3: 'value_3',
  },
  attributes: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    subscription_status: 'active',
    lifetime_spent: '100',
    bounced_email: false,
    segments: ['segment_1', 'segment_2'],
    status: 'active',
    origin: 'user.creation_source',
  },
  event: 'user_updated',
};

export const userUpdated = createTrigger({
  auth: uscreenAuth,
  name: 'user_updated',
  displayName: 'User Updated',
  description:
    'Triggers when a user’s profile or information is updated.',
  props: { setupInstructions: uscreenProps.webhookInstructions() },
  sampleData: sampleData,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    //Empty
  },

  async onDisable(context) {
    //Empty
  },

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;

    if (payload.event !== 'user_updated') {
      return [];
    }

    return [payload];
  },

  async test(context) {
    return [sampleData];
  },
});
