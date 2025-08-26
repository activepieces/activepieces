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

export const courseEnrollmentCreated = createTrigger({
  name: 'course_enrollment_created',
  displayName: 'Course Enrollment Created for Contact',
  description: 'Fires when a contact is enrolled in a course',
  auth: clickfunnelsAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: 6,
    public_id: "PdRrGD",
    contact_id: 52,
    course_id: 19,
    created_at: "2025-05-16T20:25:35.601Z",
    updated_at: "2025-06-16T20:25:35.601Z",
    suspended: false,
    suspension_reason: "Call in to reapply after robot incident",
    current_path: "/enrollments/7213d46fb0a7471696c7f5f974cb2add97cedc9118f725be3843c37a1828abc9b3",
    origination_source_type: "Membership",
    origination_source_id: 63
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces Course Enrollment Created',
          url: webhookUrl,
          event_type_ids: ['courses.enrollment.created']
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
      return [payload.data];
    }
    
    return [payload];
  },
});
