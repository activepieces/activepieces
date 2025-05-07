import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { copyAiAuth, COPY_AI_BASE_URL } from '../../index';
import { WebhookEventType, WebhookRegistrationResponse, WorkflowRunCompletedWebhookPayload } from '../common/models';

/**
 * Workflow Run Completed Trigger
 *
 * This trigger fires when a Copy.ai workflow run is completed.
 * It registers a webhook to receive notifications when workflow runs complete.
 */
export const workflowRunCompleted = createTrigger({
  name: 'workflow_run_completed',
  displayName: 'Workflow Run Completed',
  description: 'Triggered when a workflow run is completed',
  auth: copyAiAuth,
  type: TriggerStrategy.WEBHOOK,

  props: {
    // Optional: Filter by specific workflow
    workflow_id: Property.ShortText({
      displayName: 'Workflow ID',
      required: false,
      description: 'Optional: Only trigger for a specific workflow ID. Leave empty to trigger for all workflows.',
    }),
  },

  // This runs when a flow is created or enabled
  async onEnable(context) {
    const { workflow_id } = context.propsValue;

    // Prepare webhook registration request
    const requestBody: Record<string, any> = {
      url: context.webhookUrl,
      eventType: WebhookEventType.WORKFLOW_RUN_COMPLETED,
    };

    // Add workflow ID if specified
    if (workflow_id) {
      requestBody.workflowId = workflow_id;
    }

    try {
      // Register webhook with Copy.ai
      const response = await httpClient.sendRequest<WebhookRegistrationResponse>({
        method: HttpMethod.POST,
        url: `${COPY_AI_BASE_URL}/webhook`,
        headers: {
          'Content-Type': 'application/json',
          'x-copy-ai-api-key': context.auth,
        },
        body: requestBody,
      });

      // Store the webhook ID for later deletion
      await context.store.put('webhookId', response.body.data.id);

    } catch (error) {
      // Provide helpful error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to register webhook: ${errorMessage}`);
    }
  },

  // This runs when a flow is deleted or disabled
  async onDisable(context) {
    // Get the stored webhook ID
    const webhookId = await context.store.get('webhookId');

    if (webhookId) {
      try {
        // Delete the webhook from Copy.ai
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `${COPY_AI_BASE_URL}/webhook/${webhookId}`,
          headers: {
            'x-copy-ai-api-key': context.auth,
          },
        });

      } catch (error) {
        // Log error but don't throw (to avoid blocking the disable operation)
        console.error(`Failed to delete webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  },

  // This runs when a webhook event is received
  async run(context) {
    // The payload is the webhook body sent by Copy.ai
    const payload = context.payload as unknown as WorkflowRunCompletedWebhookPayload;

    // Verify this is a workflow run completed event
    if (payload && typeof payload === 'object' && 'type' in payload &&
        payload.type !== WebhookEventType.WORKFLOW_RUN_COMPLETED) {
      return [];
    }

    // Return the payload as a sample
    return [payload];
  },

  // This provides a sample for the user to see what data will be available
  async sampleData() {
    return {
      type: WebhookEventType.WORKFLOW_RUN_COMPLETED,
      workflowRunId: 'sample-run-id-123456',
      workflowId: 'sample-workflow-id-123456',
      result: {
        'Output 1': 'Sample output text from the workflow',
        'Output 2': 'Another sample output from the workflow',
      },
      metadata: {
        api: true,
        source: 'activepieces',
      },
      credits: 2,
    };
  },
});
