import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export interface OpenPhoneMessage {
  id: string;
  to: string[];
  from: string;
  text: string;
  phoneNumberId: string | null;
  direction: 'incoming' | 'outgoing';
  userId: string;
  status: 'queued' | 'sent' | 'delivered' | 'undelivered';
  createdAt: string;
  updatedAt: string;
}

export interface OpenPhoneMessageResponse {
  data: OpenPhoneMessage;
}

export interface OpenPhoneErrorResponse {
  message: string;
  code: string;
  status: number;
  docs: string;
  title: string;
  trace?: string;
  errors?: Array<{
    path: string;
    message: string;
    value: any;
    schema: {
      type: string;
    };
  }>;
  description?: string;
}

export const openPhoneCommon = {
  baseUrl: 'https://api.openphone.com',

  async makeRequest<T>(
    method: HttpMethod,
    endpoint: string,
    auth: string,
    body?: any
  ): Promise<T> {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        Authorization: auth,
      },
      body: body,
    });

    return response.body;
  },
};

export interface OpenPhoneEmail {
  name: string;
  value: string | null;
  id?: string;
}

export interface OpenPhonePhoneNumber {
  name: string;
  value: string | null;
  id?: string;
}

export interface OpenPhoneDefaultFields {
  company?: string | null;
  emails?: OpenPhoneEmail[];
  firstName: string | null;
  lastName?: string | null;
  phoneNumbers?: OpenPhonePhoneNumber[];
  role?: string | null;
}

export interface OpenPhoneCustomField {
  key: string;
  value: string | string[] | boolean | number | null;
}

export interface OpenPhoneContact {
  id: string;
  externalId: string | null;
  source: string | null;
  sourceUrl: string | null;
  defaultFields: OpenPhoneDefaultFields;
  customFields: Array<{
    name: string;
    key: string;
    id: string;
    type:
      | 'multi-select'
      | 'address'
      | 'string'
      | 'url'
      | 'boolean'
      | 'date'
      | 'number';
    value: string | string[] | boolean | number | null;
  }>;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
}

export interface OpenPhoneContactResponse {
  data: OpenPhoneContact;
}

export interface CreateOpenPhoneContactRequest {
  defaultFields: OpenPhoneDefaultFields;
  customFields?: OpenPhoneCustomField[];
  createdByUserId?: string;
  source?: string;
  sourceUrl?: string;
  externalId?: string | null;
}

export interface UpdateOpenPhoneContactRequest {
  defaultFields?: Partial<OpenPhoneDefaultFields>;
  customFields?: Array<{
    key: string;
    id?: string;
    value: string | string[] | boolean | number | null;
  }>;
  source?: string | null;
  sourceUrl?: string | null;
  externalId?: string | null;
}

export interface OpenPhoneContactsListResponse {
  data: OpenPhoneContact[];
  totalItems: number;
  nextPageToken: string | null;
}

export interface OpenPhoneCall {
  answeredAt: string | null;
  answeredBy: string | null;
  initiatedBy: string | null;
  direction: 'incoming' | 'outgoing';
  status:
    | 'queued'
    | 'initiated'
    | 'ringing'
    | 'in-progress'
    | 'completed'
    | 'busy'
    | 'failed'
    | 'no-answer'
    | 'canceled'
    | 'missed'
    | 'answered'
    | 'forwarded'
    | 'abandoned';
  completedAt: string | null;
  createdAt: string;
  duration: number;
  forwardedFrom: string | null;
  forwardedTo: string | null;
  id: string;
  phoneNumberId: string;
  participants: string[];
  updatedAt: string | null;
  userId: string;
}

export interface OpenPhoneCallsListResponse {
  data: OpenPhoneCall[];
  totalItems: number;
  nextPageToken: string | null;
}

export interface OpenPhoneCallSummaryJob {
  icon: string;
  name: string;
  result: {
    data: Array<{
      name: string;
      value: string | number | boolean;
    }>;
  };
}

export interface OpenPhoneCallSummary {
  callId: string;
  nextSteps: string[] | null;
  status: 'absent' | 'in-progress' | 'completed' | 'failed';
  summary: string[] | null;
  jobs?: OpenPhoneCallSummaryJob[] | null;
}

export interface OpenPhoneCallSummaryResponse {
  data: OpenPhoneCallSummary;
}

export interface OpenPhoneUser {
  email: string;
  firstName: string | null;
  groupId: string;
  id: string;
  lastName: string | null;
  role: string;
}

export interface OpenPhoneNumber {
  id: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  number: string;
  formattedNumber: string | null;
  forward: string | null;
  portRequestId: string | null;
  portingStatus: string | null;
  symbol: string | null;
  users: OpenPhoneUser[];
  restrictions: {
    messaging: {
      CA: 'restricted' | 'unrestricted';
      US: 'restricted' | 'unrestricted';
      Intl: 'restricted' | 'unrestricted';
    };
    calling: {
      CA: 'restricted' | 'unrestricted';
      US: 'restricted' | 'unrestricted';
      Intl: 'restricted' | 'unrestricted';
    };
  };
}

export interface OpenPhoneNumbersListResponse {
  data: OpenPhoneNumber[];
}

export interface OpenPhoneWebhook {
  id: string;
  userId: string;
  orgId: string;
  label: string | null;
  status: 'enabled' | 'disabled';
  url: string;
  key: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  events: ('call.completed' | 'call.ringing' | 'call.recording.completed')[];
  resourceIds: string[];
}

export interface OpenPhoneWebhookResponse {
  data: OpenPhoneWebhook;
}

export interface CreateOpenPhoneWebhookRequest {
  url: string;
  events: ('call.completed' | 'call.ringing' | 'call.recording.completed')[];
  resourceIds?: string[];
  userId?: string;
  label?: string;
  status?: 'enabled' | 'disabled';
}

export interface OpenPhoneMessageWebhook {
  id: string;
  userId: string;
  orgId: string;
  label: string | null;
  status: 'enabled' | 'disabled';
  url: string;
  key: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  events: ('message.received' | 'message.delivered')[];
  resourceIds: string[];
}

export interface OpenPhoneMessageWebhookResponse {
  data: OpenPhoneMessageWebhook;
}

export interface CreateOpenPhoneMessageWebhookRequest {
  url: string;
  events: ('message.received' | 'message.delivered')[];
  resourceIds?: string[];
  userId?: string;
  label?: string;
  status?: 'enabled' | 'disabled';
}
