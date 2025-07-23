import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { browseAiAuth } from '../common/auth';
import { browseAiApiCall } from '../common/client';
import { robotIdDropdown } from '../common/props';

const TRIGGER_KEY = 'browse-ai-webhook-success-id';

export const taskFinishedSuccessfully = createTrigger({
  auth: browseAiAuth,
  name: 'task_finished_successfully',
  displayName: 'Task Finished Successfully',
  description: 'Fires when a robot finishes a task successfully and the results are ready.',
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
      description: 'Include detailed task execution data with each success notification. Useful for comprehensive data processing.',
      required: false,
      defaultValue: true,
    }),
    
    includeRobotInfo: Property.Checkbox({
      displayName: 'Include Robot Information',
      description: 'Include robot configuration and metadata information with each success notification.',
      required: false,
      defaultValue: false,
    }),
    
    includeScreenshots: Property.Checkbox({
      displayName: 'Include Screenshots',
      description: 'Include captured screenshots in the webhook payload. Note: This may increase payload size significantly.',
      required: false,
      defaultValue: true,
    }),
  },

  async onEnable(context) {
    const { robotId, secretKey, includeTaskData, includeRobotInfo, includeScreenshots } = context.propsValue;
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
        event_types: ['task.completed', 'task.successful'],
        robot_id: robotId,
        active: true,
        settings: {
          include_task_data: includeTaskData ?? true,
          include_robot_info: includeRobotInfo ?? false,
          include_screenshots: includeScreenshots ?? true,
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

      console.log(`Browse AI success webhook successfully configured for robot ${robotId} with ID: ${response.webhook.id}`);
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
        
        console.log(`Browse AI success webhook successfully removed with ID: ${webhookId}`);
      } catch (error: any) {
        console.warn(`Warning: Failed to clean up webhook ${webhookId}:`, error.message);
        
        // Clean up the stored webhook ID even if deletion failed
        await context.store.delete(TRIGGER_KEY);
      }
    }
  },

  async run(context) {
    const payload = context.payload.body as Record<string, any>;

    // Validate secret key if provided
    const providedSecret = context.propsValue.secretKey;
    if (providedSecret) {
      const receivedSecret = context.payload.headers['x-webhook-secret'] || context.payload.headers['x-browse-ai-signature'] || '';
      if (receivedSecret !== providedSecret) {
        throw new Error('Unauthorized: Secret key mismatch');
      }
    }

    if (payload && typeof payload === 'object') {
      const task = payload['task'] || payload;
      
      const processedPayload = {
        taskId: task.id || payload['task_id'],
        robotId: task.robotId || payload['robot_id'],
        status: task.status || 'successful',
        
        taskData: {
          createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : payload['created_at'],
          startedAt: task.startedAt ? new Date(task.startedAt).toISOString() : payload['started_at'],
          finishedAt: task.finishedAt ? new Date(task.finishedAt).toISOString() : payload['finished_at'],
          duration: task.duration || payload['duration'],
          inputParameters: task.inputParameters || payload['input_parameters'] || {},
          runByAPI: task.runByAPI ?? payload['run_by_api'] ?? false,
        },
        
        capturedData: {
          texts: task.capturedTexts || payload['captured_texts'] || {},
          lists: task.capturedLists || payload['captured_lists'] || {},
          screenshots: (context.propsValue.includeScreenshots !== false) ? 
            (task.capturedScreenshots || payload['captured_screenshots'] || {}) : null,
        },
        
        mediaData: {
          triedRecordingVideo: task.triedRecordingVideo ?? payload['tried_recording_video'] ?? false,
          videoUrl: task.videoUrl || payload['video_url'] || null,
          screenshotUrls: task.screenshotUrls || payload['screenshot_urls'] || [],
        },
        
        executionInfo: {
          retriedOriginalTaskId: task.retriedOriginalTaskId || payload['retried_original_task_id'] || null,
          retriedByTaskId: task.retriedByTaskId || payload['retried_by_task_id'] || null,
          retryCount: task.retryCount || payload['retry_count'] || 0,
          executionTime: task.executionTime || payload['execution_time'],
        },
        
        robotInfo: (context.propsValue.includeRobotInfo && payload['robot_info']) ? {
          name: payload['robot_info']['name'],
          type: payload['robot_info']['type'],
          configuration: payload['robot_info']['configuration'],
          lastModified: payload['robot_info']['last_modified'],
        } : undefined,
        
        rawPayload: payload,
        
        webhookInfo: {
          receivedAt: new Date().toISOString(),
          source: 'browse-ai',
          type: 'task_success',
          eventType: payload['event_type'] || payload['event'] || 'task.completed',
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
        status: 'successful',
        
        taskData: {
          createdAt: '2025-01-15T14:30:22.000Z',
          startedAt: '2025-01-15T14:31:00.000Z',
          finishedAt: '2025-01-15T14:33:30.000Z',
          duration: 150,
          inputParameters: {
            search_term: 'Coffee Shops in New York',
            max_results: 10,
          },
          runByAPI: true,
        },
        
        capturedData: {
          texts: {
            title: 'Best Coffee Shops in NYC',
            description: 'Top rated coffee shops with excellent reviews',
          },
          lists: {
            searchResults: [
              { name: 'Blue Bottle Coffee', rating: '4.8', address: '123 Main St' },
              { name: 'Stumptown Coffee', rating: '4.6', address: '456 Broadway' },
              { name: 'Intelligentsia Coffee', rating: '4.7', address: '789 Park Ave' },
            ],
          },
          screenshots: {
            screenshot1: {
              url: 'https://cdn.browse.ai/screenshots/task_abc123def456_results.png',
              width: 1280,
              height: 720,
            },
          },
        },
        
        mediaData: {
          triedRecordingVideo: true,
          videoUrl: 'https://cdn.browse.ai/videos/task_abc123def456.mp4',
          screenshotUrls: [
            'https://cdn.browse.ai/screenshots/task_abc123def456_step1.png',
            'https://cdn.browse.ai/screenshots/task_abc123def456_step2.png',
          ],
        },
        
        executionInfo: {
          retriedOriginalTaskId: null,
          retriedByTaskId: null,
          retryCount: 0,
          executionTime: 150,
        },
        
        robotInfo: {
          name: 'Coffee Shop Scraper',
          type: 'data_extraction',
          configuration: {
            target_url: 'https://maps.google.com',
            extraction_rules: ['name', 'rating', 'address'],
          },
          lastModified: '2025-01-10T10:15:30.000Z',
        },
        
        rawPayload: {
          event_type: 'task.completed',
          task_id: 'task_abc123def456',
          robot_id: 'robot_xyz789',
          status: 'successful',
          created_at: '2025-01-15T14:30:22.000Z',
          started_at: '2025-01-15T14:31:00.000Z',
          finished_at: '2025-01-15T14:33:30.000Z',
          duration: 150,
          captured_texts: {
            title: 'Best Coffee Shops in NYC',
            description: 'Top rated coffee shops with excellent reviews',
          },
          captured_lists: {
            searchResults: [
              { name: 'Blue Bottle Coffee', rating: '4.8', address: '123 Main St' },
              { name: 'Stumptown Coffee', rating: '4.6', address: '456 Broadway' },
            ],
          },
        },
        
        webhookInfo: {
          receivedAt: '2025-01-15T14:33:30.000Z',
          source: 'browse-ai',
          type: 'task_success',
          eventType: 'task.completed',
        },
      },
    ];
  },

  sampleData: {
    taskId: 'sample-task-success-456',
    robotId: 'sample-robot-789',
    status: 'successful',
    
    taskData: {
      createdAt: '2025-01-15T15:45:10.000Z',
      startedAt: '2025-01-15T15:46:00.000Z',
      finishedAt: '2025-01-15T15:47:30.000Z',
      duration: 90,
      inputParameters: { 
        product_name: 'Sample Product',
        category: 'Electronics',
      },
      runByAPI: false,
    },
    
    capturedData: {
      texts: { 
        product_title: 'Sample Electronics Product',
        price: '$299.99',
      },
      lists: { 
        features: [
          { feature: 'Wireless connectivity', available: true },
          { feature: 'Long battery life', available: true },
        ],
      },
      screenshots: {
        main_page: {
          url: 'https://cdn.browse.ai/screenshots/sample-success.png',
          width: 1280,
          height: 720,
        },
      },
    },
    
    mediaData: {
      triedRecordingVideo: true,
      videoUrl: 'https://cdn.browse.ai/videos/sample-success.mp4',
      screenshotUrls: [
        'https://cdn.browse.ai/screenshots/sample-success-1.png',
      ],
    },
    
    executionInfo: {
      retriedOriginalTaskId: null,
      retriedByTaskId: null,
      retryCount: 0,
      executionTime: 90,
    },
    
    rawPayload: {
      event_type: 'task.completed',
      task_id: 'sample-task-success-456',
      robot_id: 'sample-robot-789',
      status: 'successful',
    },
    
    webhookInfo: {
      receivedAt: '2025-01-15T15:47:30.000Z',
      source: 'browse-ai',
      type: 'task_success',
      eventType: 'task.completed',
    },
  },
});
