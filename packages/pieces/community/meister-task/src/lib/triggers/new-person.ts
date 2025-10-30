import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: "new_person",
  timestamp: "2025-10-30T11:50:00Z",
  data: {
    person: {
      id: 987654,
      fullname: "Alex Johnson",
      email: "alex.johnson@example.com",
      role: "member",
      created_at: "2025-10-30T11:48:00Z"
    },
    project: {
      id: 123456,
      name: "Platform Integration",
      created_at: "2023-08-01T09:00:00Z"
    }
  }
};

export const newPerson = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_person',
  displayName: 'New Person',
  description: 'Triggers when a new person is added to a project.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions("new_person")
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'new_person') {
      return [];
    }
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
