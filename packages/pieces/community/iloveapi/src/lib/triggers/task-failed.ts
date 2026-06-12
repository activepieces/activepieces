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
  aiMetadata: {
    description:
      'Fires when an iLoveAPI processing task ends in failure (the task.failed webhook event). The event payload represents the failed task, including its tool and error details. Optionally scoped to specific tools via the tools filter so only failures from those tools trigger the flow.',
  },
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
