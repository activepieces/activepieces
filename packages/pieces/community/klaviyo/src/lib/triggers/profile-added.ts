import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';

const TRIGGER_KEY = 'klaviyo-profile-added-webhook-id';

export const profileAddedToListOrSegmentTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile-added-to-list-segment',
  displayName: 'Profile Added to List/Segment',
  description: 'Triggers when a profile is added to a specific list or segment in Klaviyo.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    listOrSegmentId: Property.ShortText({
      displayName: 'List or Segment ID',
      required: true,
    }),
  },
  async onEnable(context) {
    const { listOrSegmentId } = context.propsValue;

    const response = await klaviyoApiCall<{ data: { id: string } }>({
      apiKey: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/webhooks`,
      headers: {
        revision: '2025-04-15',
        'content-type': 'application/vnd.api+json',
        accept: 'application/vnd.api+json',
      },
      body: {
        data: {
          type: 'webhook',
          attributes: {
            url: context.webhookUrl,
            event_types: ['profile.added_to_list'],
            filter: {
              list_id: listOrSegmentId,
            },
          },
        },
      },
    });

    await context.store.put<string>(TRIGGER_KEY, response.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    if (!isNil(webhookId)) {
      await klaviyoApiCall({
        apiKey: context.auth,
        method: HttpMethod.DELETE,
        resourceUri: `/webhooks/${webhookId}`,
        headers: {
          revision: '2025-04-15',
          accept: 'application/vnd.api+json',
        },
      });
    }
  },
  async test(context) {
    return [
      {
        id: 'sample_profile_id',
        list_id: context.propsValue.listOrSegmentId,
        email: 'john@example.com',
        added_at: '2025-07-07T12:00:00Z',
      },
    ];
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    id: 'sample_profile_id',
    list_id: 'XYZ123',
    email: 'john@example.com',
    added_at: '2025-07-07T12:00:00Z',
  },
});
