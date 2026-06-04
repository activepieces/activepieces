import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import {
  matchesEvent,
  matchesToolFilter,
  toolFilterProperty,
  webhookInstructions,
} from './common';
import { taskFailedSample } from './sample-payloads';

export const taskFailedTrigger = createTrigger({
  auth: iloveapiAuth,
  name: 'task_failed',
  displayName: 'Task Failed',
  description:
    'Fires when a processing task fails. Optionally filter by tool.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    instructions: Property.MarkDown({
      value: webhookInstructions('Task Failed (task.failed)'),
    }),
    tools: toolFilterProperty,
  },
  sampleData: taskFailedSample,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const envelope = matchesEvent({
      body: context.payload.body,
      expectedEvent: 'task.failed',
    });
    if (!envelope) return [];

    const tools = (context.propsValue.tools ?? []) as string[] | undefined;
    if (!matchesToolFilter({ envelope, tools })) return [];

    return [envelope];
  },
});
