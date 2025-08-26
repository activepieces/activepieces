import { clickfunnelsAuth } from '../common/auth';
import { clickfunnelsCommon } from '../common/client';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

export const contactCompletedCourse = createTrigger({
  name: 'contact_completed_course',
  displayName: 'Contact Completed Lesson',
  description: 'Fires when a contact completes a lesson in a course',
  auth: clickfunnelsAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 5,
    public_id: "nasBOY",
    enrollment_id: 15,
    lesson_id: 15,
    completed_at: "2025-07-16T20:24:37.000Z"
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces Contact Lesson Completed',
          url: webhookUrl,
          event_type_ids: ['courses.lesson_completion.created']
        }
      },
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    };

    const response = await httpClient.sendRequest(request);
    if (response.status !== 201) {
      throw new Error(`Failed to register webhook. Status: ${response.status}`);
    }

    const webhookId = response.body.data?.id || response.body.id;
    await context.store?.put('webhookId', webhookId);
  },

  onDisable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookId = await context.store?.get('webhookId');
    
    if (!webhookId) {
      return;
    }

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints/${webhookId}`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
      },
    };

    try {
      await httpClient.sendRequest(request);
    } catch (error) {
      console.warn('Failed to unregister webhook:', error);
    }
  },

  run: async (context) => {
    const payload = context.payload.body as any;
    
    if (payload?.data) {
      const lessonCompletionData = payload.data;
      // Check if this is a lesson completion with all required fields
      if (lessonCompletionData.enrollment_id && lessonCompletionData.lesson_id && lessonCompletionData.completed_at) {
        return [lessonCompletionData];
      }
    }
    
    // Fallback for direct payload structure
    if (payload && payload.enrollment_id && payload.lesson_id && payload.completed_at) {
      return [payload];
    }
    
    return [];
  },
});
