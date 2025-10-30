import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { meisterTaskAuth } from '../common/auth';
import { meisterTaskProps } from '../common/props';

const sampleData = {
  event: "project.created",
  timestamp: "2025-10-30T12:00:00Z",
  data: {
    id: 789456,
    name: "New Product Launch",
    description: "Project for launching the new product",
    created_at: "2025-10-30T12:00:00Z",
    owner_id: 112233,
    visibility: "team",
  },
};

export const newProject = createTrigger({
  auth: meisterTaskAuth,
  name: 'new_project',
  displayName: 'New Project',
  description: 'Triggers when a new project is created.',
  props: {
    setupInstructions: meisterTaskProps.webhookInstructions("project.created"),
  },
  sampleData: sampleData.data,
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {},

  async onDisable(context) {},

  async run(context) {
    const payload = context.payload as unknown as typeof sampleData;
    if (payload.event !== 'project.created') {
      return [];
    }
    return [payload.data];
  },

  async test(context) {
    return [sampleData.data];
  },
});
