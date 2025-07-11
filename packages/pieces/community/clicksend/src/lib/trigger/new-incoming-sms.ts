import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpResponse,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { callClickSendApi } from '../common';
import { clicksendAuth } from '../..';

export const clicksendNewIncomingSms = createTrigger({
  auth: clicksendAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received',
  props: {
    from: Property.ShortText({
      displayName: 'From (Sender)',
      description: 'Filter by sender number (optional)',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Filter by message status (optional)',
      required: false,
    }),
    since: Property.Number({
      displayName: 'Since (Unix Timestamp)',
      description: 'Only messages received after this timestamp (optional)',
      required: false,
    }),
  },
  sampleData: {
    message_id: '12345678',
    status: 'RECEIVED',
    message_timestamp: 1644321600,
    message_time: '2022-02-08 01:00:00',
    message_to: '+1234567890',
    message_from: '+0987654321',
    message_body: 'Hello from ClickSend!',
    message_direction: 'in',
    message_type: 'sms',
    message_parts: 1,
    message_cost: '0.0250',
    from_email: null,
    list_id: null,
    custom_string: null,
    contact_id: null,
    user_id: 12345,
    subaccount_id: null,
    country: 'US',
    carrier: 'Verizon',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const username = context.auth.username;
    const password = context.auth.password;
    let url = 'sms/inbound?limit=20';
    const response = await callClickSendApi<MessagePaginationResponse>(
      HttpMethod.GET,
      url,
      { username, password }
    );
    await context.store.put<LastMessage>('_new_incoming_sms_trigger', {
      lastMessageId:
        response.body.data.length === 0
          ? null
          : response.body.data[0].message_id,
    });
  },
  async onDisable(context) {
    await context.store.put('_new_incoming_sms_trigger', null);
  },
  async run(context) {
    const username = context.auth.username;
    const password = context.auth.password;
    const newMessages: unknown[] = [];
    const lastMessage = await context.store.get<LastMessage>(
      '_new_incoming_sms_trigger'
    );
    let currentPage = 1;
    let hasMorePages = true;
    let firstMessageId = undefined;
    const { from, status, since } = context.propsValue;
    let filterQuery = '';
    if (from) {
      filterQuery += `&from=${encodeURIComponent(from)}`;
    }
    if (status) {
      filterQuery += `&status=${encodeURIComponent(status)}`;
    }
    if (since) {
      filterQuery += `&date_from=${since}`;
    }
    while (hasMorePages) {
      let url = `https://rest.clicksend.com/v3/sms/inbound?limit=20&page=${currentPage}${filterQuery}`;
      let res: HttpResponse<MessagePaginationResponse>;
      try {
        res = await httpClient.sendRequest<MessagePaginationResponse>({
          method: HttpMethod.GET,
          url,
          authentication: {
            type: AuthenticationType.BASIC,
            username: username,
            password: password,
          },
        });
      } catch (error: any) {
        if (error?.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error?.response?.status === 401) {
          throw new Error('Authentication failed. Check your ClickSend credentials.');
        }
        if (error?.response?.status === 500) {
          throw new Error('ClickSend internal server error. Try again later.');
        }
        throw error;
      }
      const messages = res.body.data;
      if (!firstMessageId && messages.length > 0) {
        firstMessageId = messages[0].message_id;
      }
      hasMorePages = res.body.meta.pagination.current_page < res.body.meta.pagination.total_pages;
      currentPage++;
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (message.message_id === lastMessage?.lastMessageId) {
          hasMorePages = false;
          break;
        }
        if (message.message_direction === 'in') {
          if (since && message.message_timestamp < since) {
            continue;
          }
          newMessages.push(message);
        }
      }
    }
    await context.store.put<LastMessage>('_new_incoming_sms_trigger', {
      lastMessageId: firstMessageId ?? lastMessage!.lastMessageId,
    });
    return newMessages;
  },
});

interface LastMessage {
  lastMessageId: string | null;
}

interface MessagePaginationResponse {
  data: {
    message_id: string;
    status: string;
    message_timestamp: number;
    message_time: string;
    message_to: string;
    message_from: string;
    message_body: string;
    message_direction: string;
    message_type: string;
    message_parts: number;
    message_cost: string;
    from_email: string | null;
    list_id: number | null;
    custom_string: string | null;
    contact_id: number | null;
    user_id: number;
    subaccount_id: number | null;
    country: string;
    carrier: string;
    first_name: string;
    last_name: string;
    email: string;
  }[];
  meta: {
    pagination: {
      current_page: number;
      total_pages: number;
      total_count: number;
      per_page: number;
    };
  };
} 