import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { uscreenAuth } from '../common/auth';
import { uscreenProps } from '../common/props';

const sampleData = {
  event: 'user.created',
  data: {
    id: 123456,
    email: 'newuser@example.com',
    first_name: 'John',
    last_name: 'Doe',
    created_at: '2025-10-27T13:00:00Z',
    custom_fields: {
      favorite_genre: 'Documentary',
      how_heard_about_us: 'Referral',
    },
  },
};

export const newUser = createTrigger({
  auth: uscreenAuth,
  name: 'new_user',
  displayName: 'New User',
  description:
    'Triggers when a new user is added to your storefront.',
  props: { setupInstructions: uscreenProps.webhookInstructions() },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    //Empty
  },

  async onDisable(context) {
    //Empty
  },

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;

    if (payload.event !== 'user_created') {
      return [];
    }

    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
