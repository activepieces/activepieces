import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { browseAiAuth } from '../common/auth';
import { browseAiApiCall } from '../common/client';
import { robotIdDropdown } from '../common/props';

const TRIGGER_KEY = 'browse-ai-webhook-id';

export const taskFinishedWithErrorTrigger = createTrigger({
  auth: browseAiAuth,
  name: 'task_finished_with_error',
  displayName: 'Task Finished With Error',
  description: 'Fires when a robot task run fails with an error.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    robotId: robotIdDropdown,
    
    secretKey: Property.ShortText({
      displayName: 'Webhook Secret Key (Optional)',
      description: 'A secret key to validate webhook authenticity and prevent unauthorized requests. Recommended for production workflows.',
      required: false,
    }),
    
    includeTaskData: Property.Checkbox({
      displayName: 'Include Full Task Data',
      description: 'Include detailed task execution data with each error notification. Useful for debugging but increases payload size.',
      required: false,
      defaultValue: true,
    }),
    
    includeRobotInfo: Property.Checkbox({
      displayName: 'Include Robot Information',
      description: 'Include robot configuration and metadata information with each error notification.',
      required: false,
      defaultValue: false,
    }),
    
    errorSeverity: Property.StaticDropdown({
      displayName: 'Error Severity Filter',
      description: 'Filter webhook notifications by error severity level. Choose "all" to receive all error notifications.',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All Errors', value: 'all' },
          { label: 'Critical Errors Only', value: 'critical' },
          { label: 'High & Critical Errors', value: 'high_critical' },
        ],
      },
    }),
  },
  
  async onEnable(context) {
    const { robotId, secretKey, includeTaskData, includeRobotInfo, errorSeverity } = context.propsValue;
    const apiKey = context.auth as string;

    try {
      // Verify robot exists and we have access
      await browseAiApiCall({
        method: HttpMethod.GET,
        auth: { apiKey },
        resourceUri: `/robots/${robotId}`,
      });

      const webhookBody: Record<string, any> = {
        url: context.webhookUrl,
        event_types: ['task.failed', 'task.error'],
        robot_id: robotId,
        active: true,
        settings: {
          include_task_data: includeTaskData ?? true,
          include_robot_info: includeRobotInfo ?? false,
          error_severity: errorSeverity || 'all',
        },
      };

      if (secretKey && secretKey.trim()) {
        webhookBody['secret'] = secretKey.trim();
      }

      const response = await browseAiApiCall<{
        webhook: { id: string; url: string; status: string };
      }>({
        method: HttpMethod.POST,
        auth: { apiKey },
        resourceUri: '/webhooks',
        body: webhookBody,
      });

      await context.store.put<string>(TRIGGER_KEY, response.webhook.id);

      console.log(`Browse AI webhook successfully configured for robot ${robotId} with ID: ${response.webhook.id}`);
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
          `Invalid webhook configuration: ${error.response?.data?.message || error.message}. Please check your webhook URL and robot ID.`
        );
      }
      
      if (error.response?.status === 429) {
        throw new Error(
          'Rate limit exceeded: Too many webhook requests. Please wait a moment and try again.'
        );
      }
      
      throw new Error(
        `Failed to set up webhook: ${error.message || 'Unknown error occurred'}. Please check your robot ID and try again.`
      );
    }
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    const apiKey = context.auth as string;

    if (!isNil(webhookId)) {
      try {
        await browseAiApiCall({
          method: HttpMethod.DELETE,
          auth: { apiKey },
          resourceUri: `/webhooks/${webhookId}`,
        });
        
        console.log(`Browse AI webhook successfully removed with ID: ${webhookId}`);
      } catch (error: any) {
        console.warn(`Warning: Failed to clean up webhook ${webhookId}:`, error.message);
        
        // Clean up the stored webhook ID even if deletion failed
        await context.store.delete(TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, any>;
    
    if (payload && typeof payload === 'object') {
      const processedPayload = {
        taskId: payload['task_id'] || payload['id'],
        robotId: payload['robot_id'],
        status: payload['status'] || 'failed',
        errorType: payload['error_type'] || 'unknown',
        errorMessage: payload['error_message'] || payload['message'],
        errorCode: payload['error_code'],
        
        taskData: {
          startedAt: payload['started_at'] || payload['createdAt'],
          finishedAt: payload['finished_at'] || payload['completedAt'],
          duration: payload['duration'],
          retryCount: payload['retry_count'] || 0,
          inputParameters: payload['input_parameters'] || payload['parameters'],
          capturedData: payload['captured_data'],
          screenshots: payload['screenshots'] || [],
        },
        
        errorDetails: {
          severity: payload['error_severity'] || 'medium',
          category: payload['error_category'] || 'execution',
          stackTrace: payload['stack_trace'],
          lastSuccessfulStep: payload['last_successful_step'],
          failedStep: payload['failed_step'],
          troubleshootingTips: payload['troubleshooting_tips'] || [],
        },
        
        robotInfo: payload['robot_info'] ? {
          name: payload['robot_info']['name'],
          type: payload['robot_info']['type'],
          configuration: payload['robot_info']['configuration'],
          lastModified: payload['robot_info']['last_modified'],
        } : undefined,
        
        rawPayload: payload,
        
        webhookInfo: {
          receivedAt: new Date().toISOString(),
          source: 'browse-ai',
          type: 'task_error',
          eventType: payload['event_type'] || 'task.failed',
        },
      };
      
      return [processedPayload];
    }
    
    return [payload];
  },

  async test(context) {
    return [
      {
        taskId: 'task_abc123def456',
        robotId: 'robot_xyz789',
        status: 'failed',
        errorType: 'execution_timeout',
        errorMessage: 'Task execution timed out after 300 seconds while waiting for element to load',
        errorCode: 'TIMEOUT_ERROR',
        
        taskData: {
          startedAt: '2025-01-15T14:30:22.000Z',
          finishedAt: '2025-01-15T14:35:22.000Z',
          duration: 300,
          retryCount: 2,
          inputParameters: {
            search_term: 'sample product',
            max_results: 50,
          },
          capturedData: null,
          screenshots: [
            'https://browse.ai/screenshots/task_abc123def456_step_1.png',
            'https://browse.ai/screenshots/task_abc123def456_step_2.png',
          ],
        },
        
        errorDetails: {
          severity: 'high',
          category: 'execution',
          stackTrace: 'TimeoutError: Element not found within timeout period\n  at BrowserAutomation.waitForElement\n  at RobotExecutor.executeStep',
          lastSuccessfulStep: 'Navigate to target website',
          failedStep: 'Wait for search results to load',
          troubleshootingTips: [
            'Check if the website is responsive',
            'Verify the element selector is correct',
            'Consider increasing the timeout duration',
          ],
        },
        
        robotInfo: {
          name: 'E-commerce Product Scraper',
          type: 'data_extraction',
          configuration: {
            target_url: 'https://example-store.com',
            extraction_rules: ['product_name', 'price', 'rating'],
          },
          lastModified: '2025-01-10T10:15:30.000Z',
        },
        
        rawPayload: {
          event_type: 'task.failed',
          task_id: 'task_abc123def456',
          robot_id: 'robot_xyz789',
          status: 'failed',
          error_type: 'execution_timeout',
          error_message: 'Task execution timed out after 300 seconds while waiting for element to load',
          error_code: 'TIMEOUT_ERROR',
          started_at: '2025-01-15T14:30:22.000Z',
          finished_at: '2025-01-15T14:35:22.000Z',
          duration: 300,
          retry_count: 2,
        },
        
        webhookInfo: {
          receivedAt: '2025-01-15T14:35:22.000Z',
          source: 'browse-ai',
          type: 'task_error',
          eventType: 'task.failed',
        },
      },
    ];
  },

  sampleData: {
    taskId: 'task_def456ghi789',
    robotId: 'robot_uvw123',
    status: 'failed',
    errorType: 'element_not_found',
    errorMessage: 'Required element with selector ".product-price" was not found on the page',
    errorCode: 'ELEMENT_NOT_FOUND',
    
    taskData: {
      startedAt: '2025-01-15T15:45:10.000Z',
      finishedAt: '2025-01-15T15:46:25.000Z',
      duration: 75,
      retryCount: 1,
      inputParameters: {
        product_url: 'https://example-shop.com/product/123',
      },
      capturedData: null,
      screenshots: [
        'https://browse.ai/screenshots/task_def456ghi789_error.png',
      ],
    },
    
    errorDetails: {
      severity: 'medium',
      category: 'selector',
      stackTrace: 'ElementNotFoundError: Could not locate element with selector ".product-price"\n  at ElementFinder.findElement\n  at DataExtractor.extractPrice',
      lastSuccessfulStep: 'Navigate to product page',
      failedStep: 'Extract product price',
      troubleshootingTips: [
        'Check if the CSS selector is still valid',
        'Verify the page structure hasn\'t changed',
        'Consider using a more robust selector',
      ],
    },
    
    robotInfo: {
      name: 'Product Price Monitor',
      type: 'monitoring',
      configuration: {
        check_frequency: 'daily',
        price_threshold: 100,
      },
      lastModified: '2025-01-12T09:20:15.000Z',
    },
    
    rawPayload: {
      event_type: 'task.failed',
      task_id: 'task_def456ghi789',
      robot_id: 'robot_uvw123',
      status: 'failed',
      error_type: 'element_not_found',
      error_message: 'Required element with selector ".product-price" was not found on the page',
      error_code: 'ELEMENT_NOT_FOUND',
      started_at: '2025-01-15T15:45:10.000Z',
      finished_at: '2025-01-15T15:46:25.000Z',
      duration: 75,
      retry_count: 1,
    },
    
    webhookInfo: {
      receivedAt: '2025-01-15T15:46:25.000Z',
      source: 'browse-ai',
      type: 'task_error',
      eventType: 'task.failed',
    },
  },
});
