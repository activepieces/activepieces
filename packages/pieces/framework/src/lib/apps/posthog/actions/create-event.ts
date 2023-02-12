import { createAction } from "../../../framework/action/action";

export const posthogCreateEvent = createAction({
  name: 'posthog_event_create',
  displayName: 'Create a posthog event',
  description: 'Create an event inside a project',
  sampleData: {
    success: true,
    message: 'sample message',
    results: [1, 2, 3, 4],
  },
  props: {
  },
  async run(context) {
  }
});