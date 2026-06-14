import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import {
  matchesEvent,
  matchesToolFilter,
  toolFilterProperty,
  webhookInstructions,
} from './common';
import { taskCompletedSample } from './sample-payloads';

export const taskCompletedTrigger = createTrigger({
  auth: iloveapiAuth,
  name: 'task_completed',
  displayName: 'Task Completed',
  description:
    'Fires when a processing task finishes successfully. Optionally filter by tool.',
  aiMetadata: {
    description:
      'Fires when an iLoveAPI processing task completes successfully (the task.completed webhook event). The event payload represents the finished task, including its tool and result details. Optionally scoped to specific tools via the tools filter so only completions from those tools trigger the flow.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    instructions: Property.MarkDown({
      value: webhookInstructions('Task Completed (task.completed)'),
    }),
    tools: toolFilterProperty,
  },
  sampleData: taskCompletedSample,
  async onEnable() {
    return;
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const envelope = matchesEvent({
      body: context.payload.body,
      expectedEvent: 'task.completed',
    });
    if (!envelope) return [];

    const tools = (context.propsValue.tools ?? []) as string[] | undefined;
    if (!matchesToolFilter({ envelope, tools })) return [];

    return [envelope];
  },
});
