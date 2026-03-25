import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { knockAuth } from '../auth';
import { knockApiCall } from '../common/client';

export const listMessages = createAction({
  auth: knockAuth,
  name: 'list_messages',
  displayName: 'List Messages',
  description: 'List Knock messages with optional filters and pagination.',
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'Filter messages by channel ID.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Filter messages by delivery status.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Queued', value: 'queued' },
          { label: 'Sent', value: 'sent' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Bounced', value: 'bounced' },
          { label: 'Undelivered', value: 'undelivered' },
          { label: 'Not sent', value: 'not_sent' },
        ],
      },
    }),
    source: Property.ShortText({
      displayName: 'Workflow Key',
      description: 'Filter by the workflow that generated the message.',
      required: false,
    }),
    tenant: Property.ShortText({
      displayName: 'Tenant',
      description: 'Filter messages by tenant.',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of messages per page (1–50, default 50).',
      required: false,
      defaultValue: 50,
    }),
    after: Property.ShortText({
      displayName: 'After Cursor',
      description: 'Cursor for forward pagination.',
      required: false,
    }),
  },
  async run(context) {
    const { channel_id, status, source, tenant, page_size, after } =
      context.propsValue;

    const rawPageSize = page_size ?? 50;
    const clampedPageSize = Math.max(1, Math.min(50, rawPageSize));

    const query: Record<string, string | undefined> = {
      channel_id: channel_id || undefined,
      status: status || undefined,
      source: source || undefined,
      tenant: tenant || undefined,
      page_size: String(clampedPageSize),
      after: after || undefined,
    };

    return knockApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/messages',
      query,
    });
  },
});
