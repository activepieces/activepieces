import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { browseAiAuth } from '../common/auth';
import { browseAiApiCall } from '../common/client';
import { robotIdDropdown } from '../common/props';

const TRIGGER_KEY = 'browse-ai-task_finished_successfully';

export const taskFinishedSuccessfullyTrigger = createTrigger({
  auth: browseAiAuth,
  name: 'task_finished_successfully',
  displayName: 'Task Finished Successfully',
  description:
    'Triggers when a robot finishes a task successfully.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    robotId: robotIdDropdown,
  },

  async onEnable(context) {
    const { robotId } = context.propsValue;
    const apiKey = context.auth as string;

    try {
      // Verify robot exists and we have access
      await browseAiApiCall({
        method: HttpMethod.GET,
        auth: { apiKey },
        resourceUri: `/robots/${robotId}`,
      });

      const response = await browseAiApiCall<{
        webhook: { id: string; url: string; status: string };
      }>({
        method: HttpMethod.POST,
        auth: { apiKey },
        resourceUri: `/robots/${robotId}/webhooks`,
        body: {
          hookUrl: context.webhookUrl,
          eventType: 'taskFinishedSuccessfully',
        },
      });

      await context.store.put<string>(TRIGGER_KEY, response.webhook.id);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          `Robot not found: The robot with ID "${robotId}" does not exist or you do not have access to it. Please verify the robot ID and your permissions.`
        );
      }

      if (error.response?.status === 403) {
        throw new Error(
          'Access denied: You do not have permission to set up webhooks for this robot. Please check your Browse AI account permissions and ensure you have webhook access.'
        );
      }

      if (error.response?.status === 400) {
        throw new Error(
          `Invalid webhook configuration: ${
            error.response?.data?.message || error.message
          }. Please check your webhook URL and robot ID.`
        );
      }

      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded: Too many webhook requests. Please wait a moment and try again.'
        );
      }

      throw new Error(
        `Failed to set up webhook: ${
          error.message || 'Unknown error occurred'
        }. Please check your robot ID and try again.`
      );
    }
  },

  async onDisable(context) {
    const { robotId } = context.propsValue;

    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    const apiKey = context.auth as string;

    if (!isNil(webhookId)) {
      try {
        await browseAiApiCall({
          method: HttpMethod.DELETE,
          auth: { apiKey },
          resourceUri: `/robots/${robotId}/webhooks/${webhookId}`,
        });
      } catch (error: any) {
        console.warn(
          `Warning: Failed to clean up webhook ${webhookId}:`,
          error.message
        );

        // Clean up the stored webhook ID even if deletion failed
        await context.store.delete(TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as {
      task: Record<string, any>;
      event: string;
    };

    if (payload.event !== 'task.finishedSuccessfully') return [];

    return [payload.task];
  },

  async test(context) {
    const { robotId } = context.propsValue;

    const apiKey = context.auth as string;

    const response = await browseAiApiCall<{
      result: { robotTasks: { items: { id: string }[] } };
    }>({
      method: HttpMethod.GET,
      auth: { apiKey },
      resourceUri: `/robots/${robotId}/tasks`,
      query: { status: 'successful', sort: '-createdAt' },
    });

    return response.result.robotTasks.items;
  },

  sampleData: {},
});
