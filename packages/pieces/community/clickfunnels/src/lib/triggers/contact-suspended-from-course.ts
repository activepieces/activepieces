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

export const contactSuspendedFromCourse = createTrigger({
  name: 'contact_suspended_from_course',
  displayName: 'Contact Suspended From Course',
  description: 'Fires when a contact is suspended from a course',
  auth: clickfunnelsAuth,
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: '12345678',
    type: 'courses_enrollments',
    attributes: {
      activated: true,
      suspended: true,
      completed_at: null,
      suspended_at: '2025-08-25T10:00:00Z',
      created_at: '2025-08-20T10:00:00Z',
      updated_at: '2025-08-25T10:00:00Z'
    },
    relationships: {
      contact: {
        data: {
          id: '87654321',
          type: 'contacts'
        }
      },
      course: {
        data: {
          id: '11223344',
          type: 'courses'
        }
      }
    }
  },

  onEnable: async (context) => {
    const subdomain = clickfunnelsCommon.extractSubdomain(context.auth);
    const webhookUrl = context.webhookUrl;
    
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://${subdomain}.myclickfunnels.com/api/v2/webhooks/outgoing/endpoints`,
      body: {
        endpoint: {
          name: 'Activepieces Contact Course Suspended',
          url: webhookUrl,
          event_type_ids: ['courses.enrollment.suspended']
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
    
    if (payload?.data && payload.data.attributes?.suspended === true) {
      return [payload.data];
    }
    
    return [];
  },
});
