import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import * as properties from './properties';
import * as schemas from './schemas';
import { 
  ListCampaignsResponse, 
  AddLeadParams, 
  SendSmsParams, 
  MakePhoneCallParams, 
  CampaignControlParams, 
  DeleteLeadParams,
  LeadResponse,
  GetCurrentUserResponse,
  GenerateAiReplyParams,
  GenerateAiReplyResponse,
  CreateConversationParams,
  CreateConversationResponse,
  GetConversationParams,
  GetConversationResponse,
  SendMessageParams,
  SendMessageResponse,
  ListLeadsResponse,
  LeadListItem,
  UpdateLeadParams,
  UpdateLeadResponse,
  CreateCampaignParams,
  CreateCampaignResponse,
  ListConversationsParams,
  ListConversationsResponse,
  ListCallsParams,
  ListCallsResponse,
  GetCallParams,
  GetCallResponse,
  DeleteCallParams,
  DeleteCallResponse,
  GetWhatsAppSendersParams,
  GetWhatsAppSendersResponse,
  GetWhatsAppTemplatesParams,
  GetWhatsAppTemplatesResponse,
  SendWhatsAppTemplateParams,
  SendWhatsAppTemplateResponse,
  SendWhatsAppFreeformParams,
  SendWhatsAppFreeformResponse,
  GetWhatsAppSessionStatusParams,
  GetWhatsAppSessionStatusResponse,
  ListAccountPhoneNumbersParams,
  ListAccountPhoneNumbersResponse,
  SearchAvailablePhoneNumbersParams,
  SearchAvailablePhoneNumbersResponse,
  PurchasePhoneNumberParams,
  PurchasePhoneNumberResponse,
  AssistantAssignablePhoneNumber,
  ListAssistantPhoneNumbersParams,
  AssistantWebhookMutationResponse,
} from './types';

export const baseApiUrl = 'https://app.famulor.de/';

function firstValidationErrorMessage(errors: Record<string, unknown>): string | undefined {
  for (const val of Object.values(errors)) {
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
      return val[0];
    }
  }
  return undefined;
}

function errorDetailFromBody(body: unknown): string {
  if (body === null || body === undefined) {
    return 'Unknown error';
  }
  if (typeof body === 'object') {
    const o = body as Record<string, unknown>;
    if (typeof o['error'] === 'string') {
      return o['error'];
    }
    if (typeof o['message'] === 'string') {
      const msg = o['message'];
      const errObj = o['errors'];
      if (errObj && typeof errObj === 'object' && errObj !== null) {
        const first = firstValidationErrorMessage(errObj as Record<string, unknown>);
        if (first) {
          return `${msg} ${first}`;
        }
      }
      return msg;
    }
  }
  return 'Unknown error';
}

function throwIfFamulorNotOk<T>(
  response: { status: number; body: T },
  action: string,
  successStatuses: number[] = [200],
): void {
  if (!successStatuses.includes(response.status)) {
    throw new Error(
      `${action} (${response.status}): ${errorDetailFromBody(response.body)}`,
    );
  }
}

function famulorAppErrorDetail(record: Record<string, unknown>): string {
  if (typeof record['error'] === 'string' && record['error'].length > 0) {
    return record['error'];
  }
  if (typeof record['error_code'] === 'string' && record['error_code'].length > 0) {
    return record['error_code'];
  }
  return 'Unknown error';
}

function throwIfFamulorAppFlagNotTrue(
  body: unknown,
  actionPrefix: string,
  flag: 'success' | 'status',
): void {
  if (body === null || body === undefined || typeof body !== 'object') {
    throw new Error(`${actionPrefix}: empty or invalid response body`);
  }
  const record = body as Record<string, unknown>;
  if (record[flag] !== true) {
    throw new Error(`${actionPrefix}: ${famulorAppErrorDetail(record)}`);
  }
}

function stripEmptyOptionalFields(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }
      if (value === '') {
        return false;
      }
      if (Array.isArray(value) && value.length === 0) {
        return false;
      }
      return true;
    }),
  );
}

export const famulorCommon = {
  baseHeaders: (auth: string) => ({
    'Authorization': `Bearer ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }),

  // Properties
  addLeadProperties: properties.addLead,
  sendSmsProperties: properties.sendSms,
  makePhoneCallProperties: properties.makePhoneCall,
  campaignControlProperties: properties.campaignControl,
  createCampaignProperties: properties.createCampaign,
  deleteLeadProperties: properties.deleteLead,
  updateLeadProperties: properties.updateLead,
  getCurrentUserProperties: properties.getCurrentUser,
  listLeadsProperties: properties.listLeads,
  listAccountPhoneNumbersProperties: properties.listAccountPhoneNumbers,
  searchAvailablePhoneNumbersProperties: properties.searchAvailablePhoneNumbers,
  purchasePhoneNumberProperties: properties.purchasePhoneNumber,
  generateAiReplyProperties: properties.generateAiReply,
  createConversationProperties: properties.createConversation,
  getConversationProperties: properties.getConversation,
  sendMessageProperties: properties.sendMessage,
  listConversationsProperties: properties.listConversations,
  listCallsProperties: properties.listCalls,
  getCallProperties: properties.getCall,
  deleteCallProperties: properties.deleteCall,
  getWhatsAppSendersProperties: properties.getWhatsAppSenders,
  getWhatsAppTemplatesProperties: properties.getWhatsAppTemplates,
  sendWhatsAppTemplateProperties: properties.sendWhatsAppTemplate,
  sendWhatsAppFreeformProperties: properties.sendWhatsAppFreeform,
  getWhatsAppSessionStatusProperties: properties.getWhatsAppSessionStatus,

  // Schemas
  addLeadSchema: schemas.addLead,
  sendSmsSchema: schemas.sendSms,
  makePhoneCallSchema: schemas.makePhoneCall,
  campaignControlSchema: schemas.campaignControl,
  createCampaignSchema: schemas.createCampaign,
  deleteLeadSchema: schemas.deleteLead,
  updateLeadSchema: schemas.updateLead,
  getCurrentUserSchema: schemas.getCurrentUser,
  listLeadsSchema: schemas.listLeads,
  listAccountPhoneNumbersSchema: schemas.listAccountPhoneNumbers,
  searchAvailablePhoneNumbersSchema: schemas.searchAvailablePhoneNumbers,
  purchasePhoneNumberSchema: schemas.purchasePhoneNumber,
  generateAiReplySchema: schemas.generateAiReply,
  createConversationSchema: schemas.createConversation,
  getConversationSchema: schemas.getConversation,
  sendMessageSchema: schemas.sendMessage,
  listConversationsSchema: schemas.listConversations,
  listCallsSchema: schemas.listCalls,
  getCallSchema: schemas.getCall,
  deleteCallSchema: schemas.deleteCall,
  getWhatsAppSendersSchema: schemas.getWhatsAppSenders,
  getWhatsAppTemplatesSchema: schemas.getWhatsAppTemplates,
  sendWhatsAppTemplateSchema: schemas.sendWhatsAppTemplate,
  sendWhatsAppFreeformSchema: schemas.sendWhatsAppFreeform,
  getWhatsAppSessionStatusSchema: schemas.getWhatsAppSessionStatus,

  // Methods

  fetchAllAssistantPages: async ({
    auth,
    type,
  }: {
    auth: string;
    type?: string;
  }): Promise<any[]> => {
    const MAX_PAGES = 50;
    const allAssistants: any[] = [];
    let page = 1;

    while (page <= MAX_PAGES) {
      const result = await famulorCommon.listAllAssistants({
        auth,
        per_page: 100,
        page,
        type,
      });

      if (!result.data || result.data.length === 0) {
        break;
      }

      allAssistants.push(...result.data);

      if (!result.last_page || page >= result.last_page) {
        break;
      }

      page++;
    }

    return allAssistants;
  },

  listAllAssistants: async ({ auth, per_page = 10, page = 1, type }: { auth: string; per_page?: number; page?: number; type?: string }) => {
    const queryParams: Record<string, string> = {
      per_page: per_page.toString(),
      page: page.toString(),
    };
    
    if (type && type !== '') {
      queryParams['type'] = type;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/assistants/get`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch assistants: ${response.status}`);
    }

    return response.body;
  },

  listPhoneNumbers: async (
    params: ListAssistantPhoneNumbersParams,
  ): Promise<AssistantAssignablePhoneNumber[]> => {
    const { auth, type } = params;

    const response = await httpClient.sendRequest<
      AssistantAssignablePhoneNumber[] | { data: AssistantAssignablePhoneNumber[] }
    >({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/assistants/phone-numbers`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams: type ? { type } : undefined,
    });

    throwIfFamulorNotOk(response, 'Failed to fetch assistant-assignable phone numbers');

    const body = response.body;
    if (Array.isArray(body)) {
      return body;
    }
    if (
      body &&
      typeof body === 'object' &&
      Array.isArray((body as { data?: unknown }).data)
    ) {
      return (body as { data: AssistantAssignablePhoneNumber[] }).data;
    }

    return [];
  },

  listAssistants: async ({ auth }: { auth: string }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/assistants/outbound`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch assistants: ${response.status}`);
    }

    return response.body || [];
  },

  listAccountPhoneNumbers: async ({
    auth,
  }: ListAccountPhoneNumbersParams): Promise<ListAccountPhoneNumbersResponse> => {
    const response = await httpClient.sendRequest<ListAccountPhoneNumbersResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/phone-numbers/all`,
      headers: famulorCommon.baseHeaders(auth),
    });

    throwIfFamulorNotOk(response, 'Failed to list phone numbers');

    return response.body;
  },

  searchAvailablePhoneNumbers: async (
    params: SearchAvailablePhoneNumbersParams,
  ): Promise<SearchAvailablePhoneNumbersResponse> => {
    const { auth, country_code, contains } = params;

    const queryParams: Record<string, string> = {
      country_code,
    };

    const trimmedContains = contains?.trim();
    if (trimmedContains && /^\d{1,10}$/.test(trimmedContains)) {
      queryParams['contains'] = trimmedContains;
    }

    const response = await httpClient.sendRequest<SearchAvailablePhoneNumbersResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/phone-numbers/search`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    throwIfFamulorNotOk(response, 'Failed to search available phone numbers');

    return response.body;
  },

  purchasePhoneNumber: async (
    params: PurchasePhoneNumberParams,
  ): Promise<PurchasePhoneNumberResponse> => {
    const { auth, phone_number } = params;

    const response = await httpClient.sendRequest<PurchasePhoneNumberResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/phone-numbers/purchase`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        phone_number: phone_number.trim(),
      },
    });

    throwIfFamulorNotOk(response, 'Failed to purchase phone number', [200, 201]);

    return response.body;
  },

  listLeads: async ({ auth }: { auth: string }): Promise<ListLeadsResponse> => {
    const response = await httpClient.sendRequest<ListLeadsResponse | LeadListItem[]>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/leads`,
      headers: famulorCommon.baseHeaders(auth),
    });

    throwIfFamulorNotOk(response, 'Failed to fetch leads');

    const body = response.body;
    if (Array.isArray(body)) {
      return { leads: body };
    }
    if (body && typeof body === 'object' && Array.isArray(body.leads)) {
      return { leads: body.leads };
    }
    return { leads: [] };
  },

  listCampaigns: async ({ auth }: { auth: string }) => {
    const response = await httpClient.sendRequest<ListCampaignsResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/campaigns`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch campaigns: ${response.status}`);
    }

    return response.body.campaigns || response.body;
  },

  createCampaign: async (
    params: CreateCampaignParams,
  ): Promise<CreateCampaignResponse> => {
    const { auth, ...rest } = params;
    const body = stripEmptyOptionalFields(rest as Record<string, unknown>);

    const response = await httpClient.sendRequest<CreateCampaignResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/campaigns`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    throwIfFamulorNotOk(response, 'Failed to create campaign', [200, 201]);

    return response.body;
  },

  addLead: async (params: AddLeadParams): Promise<LeadResponse> => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest<LeadResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/lead`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    throwIfFamulorNotOk(response, 'Failed to add lead');

    return response.body;
  },

  sendSms: async (params: SendSmsParams) => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/sms`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to send SMS: ${response.status}`);
    }

    return response.body;
  },

  makePhoneCall: async (params: MakePhoneCallParams) => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/make_call`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to make phone call: ${response.status}`);
    }

    return response.body;
  },

  campaignControl: async (params: CampaignControlParams) => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/campaigns/update-status`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to control campaign: ${response.status}`);
    }

    return response.body;
  },

  deleteLead: async (params: DeleteLeadParams) => {
    const { auth, lead_id } = params;
    
    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${baseApiUrl}api/user/leads/${lead_id}`,
      headers: famulorCommon.baseHeaders(auth),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to delete lead: ${response.status}`);
    }

    return response.body;
  },

  updateLead: async (params: UpdateLeadParams): Promise<UpdateLeadResponse> => {
    const { auth, lead_id, campaign_id, phone_number, status, variables } = params;

    const body: Record<string, unknown> = {};
    if (campaign_id !== undefined && campaign_id !== null) {
      body['campaign_id'] = campaign_id;
    }
    const trimmedPhone = phone_number?.trim();
    if (trimmedPhone) {
      body['phone_number'] = trimmedPhone;
    }
    if (status !== undefined && status !== null) {
      body['status'] = status;
    }
    if (variables !== undefined && variables !== null && Object.keys(variables).length > 0) {
      body['variables'] = variables;
    }

    const response = await httpClient.sendRequest<UpdateLeadResponse>({
      method: HttpMethod.PUT,
      url: `${baseApiUrl}api/user/leads/${lead_id}`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    throwIfFamulorNotOk(response, 'Failed to update lead');

    return response.body;
  },

  enableInboundWebhook: async ({
    auth,
    assistant_id,
    webhook_url,
  }: {
    auth: string;
    assistant_id: number;
    webhook_url: string;
  }): Promise<AssistantWebhookMutationResponse> => {
    const response = await httpClient.sendRequest<AssistantWebhookMutationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/enable-inbound-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
        webhook_url,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to enable inbound webhook');

    return response.body;
  },

  disableInboundWebhook: async ({
    auth,
    assistant_id,
  }: {
    auth: string;
    assistant_id: number;
  }): Promise<AssistantWebhookMutationResponse> => {
    const response = await httpClient.sendRequest<AssistantWebhookMutationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/disable-inbound-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to disable inbound webhook');

    return response.body;
  },

  enablePostCallWebhook: async ({
    auth,
    assistant_id,
    webhook_url,
  }: {
    auth: string;
    assistant_id: number;
    webhook_url: string;
  }): Promise<AssistantWebhookMutationResponse> => {
    const response = await httpClient.sendRequest<AssistantWebhookMutationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/enable-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
        webhook_url,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to enable post-call webhook');

    return response.body;
  },

  disablePostCallWebhook: async ({
    auth,
    assistant_id,
  }: {
    auth: string;
    assistant_id: number;
  }): Promise<AssistantWebhookMutationResponse> => {
    const response = await httpClient.sendRequest<AssistantWebhookMutationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/disable-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to disable post-call webhook');

    return response.body;
  },

  enableConversationEndedWebhook: async ({
    auth,
    assistant_id,
    webhook_url,
  }: {
    auth: string;
    assistant_id: number;
    webhook_url: string;
  }): Promise<AssistantWebhookMutationResponse> => {
    const response = await httpClient.sendRequest<AssistantWebhookMutationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/enable-conversation-ended-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
        webhook_url,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to enable conversation ended webhook');

    return response.body;
  },

  disableConversationEndedWebhook: async ({
    auth,
    assistant_id,
  }: {
    auth: string;
    assistant_id: number;
  }): Promise<AssistantWebhookMutationResponse> => {
    const response = await httpClient.sendRequest<AssistantWebhookMutationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/assistants/disable-conversation-ended-webhook`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        assistant_id,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to disable conversation ended webhook');

    return response.body;
  },

  getCurrentUser: async ({ auth }: { auth: string }): Promise<GetCurrentUserResponse> => {
    const response = await httpClient.sendRequest<GetCurrentUserResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/me`,
      headers: famulorCommon.baseHeaders(auth),
    });

    throwIfFamulorNotOk(response, 'Failed to get user information');

    return response.body;
  },

  generateAiReply: async (params: GenerateAiReplyParams): Promise<GenerateAiReplyResponse> => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest<GenerateAiReplyResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/ai/generate-reply`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    throwIfFamulorNotOk(response, 'Failed to generate AI reply');
    throwIfFamulorAppFlagNotTrue(response.body, 'Failed to generate AI reply', 'success');

    return response.body;
  },

  createConversation: async (params: CreateConversationParams): Promise<CreateConversationResponse> => {
    const { auth, ...body } = params;
    
    const response = await httpClient.sendRequest<CreateConversationResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/conversations`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    throwIfFamulorNotOk(response, 'Failed to create conversation');
    throwIfFamulorAppFlagNotTrue(response.body, 'Failed to create conversation', 'status');

    return response.body;
  },

  getConversation: async (params: GetConversationParams): Promise<GetConversationResponse> => {
    const { auth, uuid } = params;
    
    const response = await httpClient.sendRequest<GetConversationResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/conversations/${uuid}`,
      headers: famulorCommon.baseHeaders(auth),
    });

    throwIfFamulorNotOk(response, 'Failed to get conversation');
    throwIfFamulorAppFlagNotTrue(response.body, 'Failed to get conversation', 'status');

    return response.body;
  },

  sendMessage: async (params: SendMessageParams): Promise<SendMessageResponse> => {
    const { auth, uuid, message } = params;
    
    const response = await httpClient.sendRequest<SendMessageResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/conversations/${uuid}/messages`,
      headers: famulorCommon.baseHeaders(auth),
      body: { message },
    });

    throwIfFamulorNotOk(response, 'Failed to send message');
    throwIfFamulorAppFlagNotTrue(response.body, 'Failed to send message', 'status');

    return response.body;
  },

  listConversations: async (
    params: ListConversationsParams,
  ): Promise<ListConversationsResponse> => {
    const {
      auth,
      type,
      assistant_id,
      customer_phone,
      whatsapp_sender_phone,
      external_identifier,
      per_page,
      cursor,
    } = params;

    const queryParams: Record<string, string> = {};
    if (type !== undefined) {
      queryParams['type'] = type;
    }
    if (assistant_id !== undefined) {
      queryParams['assistant_id'] = String(assistant_id);
    }
    if (customer_phone !== undefined && customer_phone.trim() !== '') {
      queryParams['customer_phone'] = customer_phone.trim();
    }
    if (whatsapp_sender_phone !== undefined && whatsapp_sender_phone.trim() !== '') {
      queryParams['whatsapp_sender_phone'] = whatsapp_sender_phone.trim();
    }
    if (external_identifier !== undefined && external_identifier.trim() !== '') {
      queryParams['external_identifier'] = external_identifier.trim();
    }
    if (per_page !== undefined) {
      queryParams['per_page'] = String(per_page);
    }
    if (cursor !== undefined && cursor.trim() !== '') {
      queryParams['cursor'] = cursor.trim();
    }

    const response = await httpClient.sendRequest<ListConversationsResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/conversations`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    throwIfFamulorNotOk(response, 'Failed to list conversations');

    return response.body;
  },

  listCalls: async (params: ListCallsParams): Promise<ListCallsResponse> => {
    const {
      auth,
      status,
      type,
      phone_number,
      assistant_id,
      campaign_id,
      date_from,
      date_to,
      per_page,
      page,
    } = params;

    const queryParams: Record<string, string> = {};
    if (status !== undefined) {
      queryParams['status'] = status;
    }
    if (type !== undefined) {
      queryParams['type'] = type;
    }
    if (phone_number !== undefined && phone_number.trim() !== '') {
      queryParams['phone_number'] = phone_number.trim();
    }
    if (assistant_id !== undefined) {
      queryParams['assistant_id'] = String(assistant_id);
    }
    if (campaign_id !== undefined) {
      queryParams['campaign_id'] = String(campaign_id);
    }
    if (date_from !== undefined && date_from.trim() !== '') {
      queryParams['date_from'] = date_from.trim();
    }
    if (date_to !== undefined && date_to.trim() !== '') {
      queryParams['date_to'] = date_to.trim();
    }
    if (per_page !== undefined) {
      queryParams['per_page'] = String(per_page);
    }
    if (page !== undefined) {
      queryParams['page'] = String(page);
    }

    const response = await httpClient.sendRequest<ListCallsResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/calls`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    throwIfFamulorNotOk(response, 'Failed to list calls');

    return response.body;
  },

  getCall: async (params: GetCallParams): Promise<GetCallResponse> => {
    const { auth, call_id } = params;

    const response = await httpClient.sendRequest<GetCallResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/calls/${call_id}`,
      headers: famulorCommon.baseHeaders(auth),
    });

    throwIfFamulorNotOk(response, 'Failed to get call');

    return response.body;
  },

  deleteCall: async (params: DeleteCallParams): Promise<DeleteCallResponse> => {
    const { auth, call_id } = params;

    const response = await httpClient.sendRequest<DeleteCallResponse | null | undefined>({
      method: HttpMethod.DELETE,
      url: `${baseApiUrl}api/user/calls/${call_id}`,
      headers: famulorCommon.baseHeaders(auth),
    });

    throwIfFamulorNotOk(response, 'Failed to delete call', [200, 204]);

    return response.body ?? { message: 'Call deleted' };
  },

  getWhatsAppSenders: async (
    params: GetWhatsAppSendersParams,
  ): Promise<GetWhatsAppSendersResponse> => {
    const { auth, status } = params;

    const queryParams: Record<string, string> = {};
    if (status !== undefined) {
      queryParams['status'] = status;
    }

    const response = await httpClient.sendRequest<GetWhatsAppSendersResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/whatsapp/senders`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    throwIfFamulorNotOk(response, 'Failed to fetch WhatsApp senders');

    return response.body;
  },

  getWhatsAppTemplates: async (
    params: GetWhatsAppTemplatesParams,
  ): Promise<GetWhatsAppTemplatesResponse> => {
    const { auth, sender_id, status } = params;

    const queryParams: Record<string, string> = {};
    if (status !== undefined) {
      queryParams['status'] = status;
    }

    const response = await httpClient.sendRequest<GetWhatsAppTemplatesResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/whatsapp/senders/${sender_id}/templates`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams,
    });

    throwIfFamulorNotOk(response, 'Failed to fetch WhatsApp templates');

    return response.body;
  },

  sendWhatsAppTemplate: async (
    params: SendWhatsAppTemplateParams,
  ): Promise<SendWhatsAppTemplateResponse> => {
    const { auth, sender_id, template_id, recipient_phone, recipient_name, variables } =
      params;

    const body: Record<string, unknown> = {
      sender_id,
      template_id,
      recipient_phone: recipient_phone.trim(),
    };
    const name = recipient_name?.trim();
    if (name) {
      body['recipient_name'] = name;
    }
    if (variables !== undefined && Object.keys(variables).length > 0) {
      body['variables'] = variables;
    }

    const response = await httpClient.sendRequest<SendWhatsAppTemplateResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/whatsapp/send`,
      headers: famulorCommon.baseHeaders(auth),
      body,
    });

    throwIfFamulorNotOk(response, 'Failed to send WhatsApp template message');
    throwIfFamulorAppFlagNotTrue(
      response.body,
      'Failed to send WhatsApp template message',
      'success',
    );

    return response.body;
  },

  sendWhatsAppFreeform: async (
    params: SendWhatsAppFreeformParams,
  ): Promise<SendWhatsAppFreeformResponse> => {
    const { auth, sender_id, recipient_phone, message } = params;

    const messageTrimmed = message.trim();

    const response = await httpClient.sendRequest<SendWhatsAppFreeformResponse>({
      method: HttpMethod.POST,
      url: `${baseApiUrl}api/user/whatsapp/send-freeform`,
      headers: famulorCommon.baseHeaders(auth),
      body: {
        sender_id,
        recipient_phone: recipient_phone.trim(),
        message: messageTrimmed,
      },
    });

    throwIfFamulorNotOk(response, 'Failed to send WhatsApp freeform message');
    throwIfFamulorAppFlagNotTrue(
      response.body,
      'Failed to send WhatsApp freeform message',
      'success',
    );

    return response.body;
  },

  getWhatsAppSessionStatus: async (
    params: GetWhatsAppSessionStatusParams,
  ): Promise<GetWhatsAppSessionStatusResponse> => {
    const { auth, sender_id, recipient_phone } = params;

    const response = await httpClient.sendRequest<GetWhatsAppSessionStatusResponse>({
      method: HttpMethod.GET,
      url: `${baseApiUrl}api/user/whatsapp/session-status`,
      headers: famulorCommon.baseHeaders(auth),
      queryParams: {
        sender_id: String(sender_id),
        recipient_phone: recipient_phone.trim(),
      },
    });

    throwIfFamulorNotOk(response, 'Failed to get WhatsApp session status');
    throwIfFamulorAppFlagNotTrue(
      response.body,
      'Failed to get WhatsApp session status',
      'success',
    );

    return response.body;
  },
};
