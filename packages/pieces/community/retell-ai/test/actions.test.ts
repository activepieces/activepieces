import { afterEach, describe, expect, it, vi } from 'vitest';
import { retellAi } from '../src';
import { createBatchCallAction } from '../src/lib/actions/create-batch-call';
import { createPhoneNumber } from '../src/lib/actions/create-phone-number';
import { getAgent } from '../src/lib/actions/get-agent';
import { getCall } from '../src/lib/actions/get-call';
import { getPhoneNumber } from '../src/lib/actions/get-phone-number';
import { getVoice } from '../src/lib/actions/get-voice';
import { makePhoneCall } from '../src/lib/actions/make-phone-call';
import { addKnowledgeBaseSourcesAction } from '../src/lib/actions/ai/add-knowledge-base-sources';
import { buyPhoneNumberAction } from '../src/lib/actions/ai/buy-phone-number';
import { createChatAction } from '../src/lib/actions/ai/create-chat';
import { createContactAction } from '../src/lib/actions/ai/create-contact';
import { createKnowledgeBaseAction } from '../src/lib/actions/ai/create-knowledge-base';
import { createPhoneCallAction } from '../src/lib/actions/ai/create-phone-call';
import { createSmsChatAction } from '../src/lib/actions/ai/create-sms-chat';
import { createWebCallAction } from '../src/lib/actions/ai/create-web-call';
import { deleteAgentAction } from '../src/lib/actions/ai/delete-agent';
import { deleteCallAction } from '../src/lib/actions/ai/delete-call';
import { deleteKnowledgeBaseAction } from '../src/lib/actions/ai/delete-knowledge-base';
import { deleteKnowledgeBaseSourceAction } from '../src/lib/actions/ai/delete-knowledge-base-source';
import { deletePhoneNumberAction } from '../src/lib/actions/ai/delete-phone-number';
import { endChatAction } from '../src/lib/actions/ai/end-chat';
import { getAgentByIdAction } from '../src/lib/actions/ai/get-agent-by-id';
import { getCallByIdAction } from '../src/lib/actions/ai/get-call-by-id';
import { getChatAction } from '../src/lib/actions/ai/get-chat';
import { getChatAgentAction } from '../src/lib/actions/ai/get-chat-agent';
import { getConcurrencyAction } from '../src/lib/actions/ai/get-concurrency';
import { getContactByPhoneAction } from '../src/lib/actions/ai/get-contact-by-phone';
import { getKnowledgeBaseAction } from '../src/lib/actions/ai/get-knowledge-base';
import { getRetellLlmAction } from '../src/lib/actions/ai/get-retell-llm';
import { getVoiceByIdAction } from '../src/lib/actions/ai/get-voice-by-id';
import { listAgentVersionsAction } from '../src/lib/actions/ai/list-agent-versions';
import { listAgentsAction } from '../src/lib/actions/ai/list-agents';
import { listCallsAction } from '../src/lib/actions/ai/list-calls';
import { listChatAgentsAction } from '../src/lib/actions/ai/list-chat-agents';
import { listChatsAction } from '../src/lib/actions/ai/list-chats';
import { listContactsAction } from '../src/lib/actions/ai/list-contacts';
import { listKnowledgeBasesAction } from '../src/lib/actions/ai/list-knowledge-bases';
import { listPhoneNumbersAction } from '../src/lib/actions/ai/list-phone-numbers';
import { listRetellLlmsAction } from '../src/lib/actions/ai/list-retell-llms';
import { listVoicesAction } from '../src/lib/actions/ai/list-voices';
import { publishAgentAction } from '../src/lib/actions/ai/publish-agent';
import { sendChatMessageAction } from '../src/lib/actions/ai/send-chat-message';
import { stopCallAction } from '../src/lib/actions/ai/stop-call';
import { updateAgentAction } from '../src/lib/actions/ai/update-agent';
import { updateCallMetadataAction } from '../src/lib/actions/ai/update-call-metadata';
import { updateContactAction } from '../src/lib/actions/ai/update-contact';
import { updatePhoneNumberAgentsAction } from '../src/lib/actions/ai/update-phone-number-agents';
import { updateRetellLlmPromptAction } from '../src/lib/actions/ai/update-retell-llm-prompt';
import { AGENT, CALL, CHAT, CONTACT, KB, LLM, PHONE, VOICE } from './fixtures';
import { API_KEY, BASE, invoke, makeContext, stubFetch, toRecord } from './helpers';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type RunnableAction = {
  name: string;
  outputSchema?: { fields: { key: string }[] };
  run: (...args: never[]) => Promise<unknown>;
};

function runAction({ action, props }: { action: RunnableAction; props: Record<string, unknown> }) {
  return invoke({ fn: action.run, self: action, args: [makeContext({ props })] });
}

const PAGE = (items: unknown[]) => ({ items, pagination_key: 'next_1', has_more: true });

const cases: {
  action: RunnableAction;
  props: Record<string, unknown>;
  response?: unknown;
  status?: number;
  method: string;
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  check?: (output: Record<string, unknown>) => void;
  raw?: boolean;
}[] = [
  {
    action: makePhoneCall,
    props: { fromNumber: '+14155550100', toNumber: '+14155550101', overrideAgentId: 'agent_1', overrideAgentVersion: 2, dynamicVariables: { n: 5, ok: true, name: 'Ann' } },
    response: CALL,
    status: 201,
    method: 'POST',
    path: '/v2/create-phone-call',
    body: {
      from_number: '+14155550100',
      to_number: '+14155550101',
      override_agent_id: 'agent_1',
      override_agent_version: 2,
      retell_llm_dynamic_variables: { n: '5', ok: 'true', name: 'Ann' },
    },
    raw: true,
  },
  {
    action: createPhoneNumber,
    props: { nickname: 'Main', areaCode: 415, inboundAgentId: 'agent_1', inboundAgentVersion: 2, tollFree: false, countryCode: 'US', numberProvider: 'twilio' },
    response: PHONE,
    status: 201,
    method: 'POST',
    path: '/create-phone-number',
    body: {
      nickname: 'Main',
      area_code: 415,
      inbound_agents: [{ agent_id: 'agent_1', agent_version: 2, weight: 1 }],
      toll_free: false,
      country_code: 'US',
      number_provider: 'twilio',
    },
    raw: true,
  },
  { action: getCall, props: { callId: 'call_1' }, response: CALL, method: 'GET', path: '/v2/get-call/call_1', raw: true },
  { action: getPhoneNumber, props: { phoneNumber: '+14155550100' }, response: PHONE, method: 'GET', path: '/get-phone-number/%2B14155550100', raw: true },
  { action: getVoice, props: { voiceId: '11labs-Adrian' }, response: VOICE, method: 'GET', path: '/get-voice/11labs-Adrian', raw: true },
  { action: getAgent, props: { agentId: 'agent_1', version: 3 }, response: AGENT, method: 'GET', path: '/get-agent/agent_1', query: { version: '3' }, raw: true },
  {
    action: createBatchCallAction,
    props: {
      from_number: '+14155550100',
      name: 'Promo',
      agent_id: 'agent_1',
      scheduled_time: '2026-10-14T10:00:00Z',
      tasks: [{ to_number: '+14155550101', dynamic_variables: '{"name":"Ann","age":30}' }, { to_number: '+14155550102' }],
    },
    response: { batch_call_id: 'batch_1', name: 'Promo', from_number: '+14155550100', scheduled_timestamp: 1791972000000, total_task_count: 2 },
    status: 201,
    method: 'POST',
    path: '/create-batch-call',
    body: {
      from_number: '+14155550100',
      name: 'Promo',
      trigger_timestamp: Date.parse('2026-10-14T10:00:00Z'),
      tasks: [
        { to_number: '+14155550101', retell_llm_dynamic_variables: { name: 'Ann', age: '30' }, override_agent_id: 'agent_1' },
        { to_number: '+14155550102', override_agent_id: 'agent_1' },
      ],
    },
    check: (out) => expect(out['total_task_count']).toBe(2),
  },
  {
    action: createPhoneCallAction,
    props: { from_number: '+14155550100', to_number: '+14155550101', agent_version: 'prod', metadata: { a: 1 } },
    response: { ...CALL, call_status: 'registered' },
    status: 201,
    method: 'POST',
    path: '/v2/create-phone-call',
    body: { from_number: '+14155550100', to_number: '+14155550101', override_agent_version: 'prod', metadata: { a: 1 } },
    check: (out) => {
      expect(out['call_id']).toBe('call_1');
      expect(out['call_status']).toBe('registered');
    },
  },
  {
    action: createWebCallAction,
    props: { agent_id: 'agent_1', agent_version: '4' },
    response: { call_id: 'call_w', access_token: 'tok', expires_at: '2026-10-13T10:00:30Z' },
    status: 201,
    method: 'POST',
    path: '/v3/create-web-call',
    body: { agent_id: 'agent_1', agent_version: 4 },
    check: (out) => expect(out['access_token']).toBe('tok'),
  },
  {
    action: getCallByIdAction,
    props: { call_id: 'call_1' },
    response: CALL,
    method: 'GET',
    path: '/v2/get-call/call_1',
    check: (out) => {
      expect(out['call_summary']).toBe('Confirmed.');
      expect(out['combined_cost_cents']).toBe(7.1);
      expect(out['start_time']).toBe(new Date(1703302407333).toISOString());
      expect(out['twilio_call_sid']).toBe('CA1');
    },
  },
  {
    action: listCallsAction,
    props: { agent_id: 'agent_1', call_status: 'ended,error', direction: 'inbound', from_number: '+14155550100', started_after: '1700000000', started_before: '2026-01-01T00:00:00Z', limit: 10, pagination_key: 'pk' },
    response: PAGE([CALL]),
    method: 'POST',
    path: '/v3/list-calls',
    body: {
      sort_order: 'descending',
      limit: 10,
      pagination_key: 'pk',
      filter_criteria: {
        agent: [{ agent_id: 'agent_1' }],
        call_status: { type: 'enum', op: 'in', value: ['ended', 'error'] },
        direction: { type: 'enum', op: 'in', value: ['inbound'] },
        from_number: { type: 'string', op: 'eq', value: '+14155550100' },
        start_timestamp: { type: 'range', op: 'bt', value: [1700000000000, Date.parse('2026-01-01T00:00:00Z')] },
      },
    },
    check: (out) => {
      expect(out['count']).toBe(1);
      expect(out['pagination_key']).toBe('next_1');
      expect(out['has_more']).toBe(true);
    },
  },
  {
    action: updateCallMetadataAction,
    props: { call_id: 'call_1', metadata: '{"crm":"9"}', data_storage_setting: 'everything' },
    response: CALL,
    method: 'PATCH',
    path: '/v2/update-call/call_1',
    body: { metadata: { crm: '9' }, data_storage_setting: 'everything' },
  },
  {
    action: stopCallAction,
    props: { call_id: 'call_1' },
    status: 204,
    method: 'POST',
    path: '/v2/stop-call/call_1',
    check: (out) => expect(out).toEqual({ call_id: 'call_1', stopped: true, reason: null }),
  },
  {
    action: deleteCallAction,
    props: { call_id: 'call_1' },
    status: 204,
    method: 'DELETE',
    path: '/v2/delete-call/call_1',
    check: (out) => expect(out).toEqual({ call_id: 'call_1', deleted: true, already_deleted: false }),
  },
  {
    action: listAgentsAction,
    props: { channel: 'voice', search: 'Set', limit: 5 },
    response: PAGE([{ agent_id: 'agent_1', agent_name: 'Setter', channel: 'voice', user_modified_timestamp: 1703413636133, tags: {} }]),
    method: 'POST',
    path: '/v2/list-agents',
    query: { limit: '5' },
    body: { filter_criteria: { channel: { type: 'string', op: 'eq', value: 'voice' }, query: 'Set' } },
    check: (out) => expect(out['items']).toEqual([
      { agent_id: 'agent_1', agent_name: 'Setter', channel: 'voice', version: null, is_published: null, last_modified_time: new Date(1703413636133).toISOString() },
    ]),
  },
  {
    action: listChatAgentsAction,
    props: { pagination_key: 'pk' },
    response: PAGE([]),
    method: 'POST',
    path: '/v2/list-agents',
    query: { limit: '50', pagination_key: 'pk' },
    body: { filter_criteria: { channel: { type: 'string', op: 'eq', value: 'chat' } } },
  },
  {
    action: getAgentByIdAction,
    props: { agent_id: 'agent_1' },
    response: AGENT,
    method: 'GET',
    path: '/get-agent/agent_1',
    check: (out) => {
      expect(out['llm_id']).toBe('llm_1');
      expect(out['response_engine_type']).toBe('retell-llm');
    },
  },
  { action: getChatAgentAction, props: { agent_id: 'agent_c', version: 1 }, response: AGENT, method: 'GET', path: '/get-chat-agent/agent_c', query: { version: '1' } },
  {
    action: listAgentVersionsAction,
    props: { agent_id: 'agent_1' },
    response: PAGE([{ version: 2, is_published: true, version_title: 'v2', base_version: 1, last_modification_timestamp: 1 }]),
    method: 'GET',
    path: '/list-agent-versions/agent_1',
    query: { limit: '50', sort_order: 'descending' },
  },
  {
    action: updateAgentAction,
    props: { agent_id: 'agent_1', agent_name: 'New', clear_webhook_url: true },
    response: AGENT,
    method: 'PATCH',
    path: '/update-agent/agent_1',
    body: { agent_name: 'New', webhook_url: null },
  },
  {
    action: publishAgentAction,
    props: { agent_id: 'agent_1', version: 3, version_title: 'Release' },
    status: 200,
    method: 'POST',
    path: '/publish-agent-version/agent_1',
    body: { version: 3, version_title: 'Release' },
    check: (out) => expect(out).toEqual({ agent_id: 'agent_1', version: 3, published: true }),
  },
  {
    action: deleteAgentAction,
    props: { agent_id: 'agent_1' },
    status: 204,
    method: 'DELETE',
    path: '/delete-agent/agent_1',
    check: (out) => expect(out['deleted']).toBe(true),
  },
  {
    action: createChatAction,
    props: { agent_id: 'agent_c', dynamic_variables: { a: 1 } },
    response: CHAT,
    status: 201,
    method: 'POST',
    path: '/create-chat',
    body: { agent_id: 'agent_c', retell_llm_dynamic_variables: { a: '1' } },
    check: (out) => expect(out['chat_id']).toBe('chat_1'),
  },
  {
    action: sendChatMessageAction,
    props: { chat_id: 'chat_1', content: 'Hello' },
    response: {
      messages: [
        { message_id: 'm1', role: 'agent', content: 'Hi there', created_timestamp: 1 },
        { message_id: 'm2', role: 'agent', content: 'How can I help?', created_timestamp: 2 },
      ],
    },
    status: 201,
    method: 'POST',
    path: '/create-chat-completion',
    body: { chat_id: 'chat_1', content: 'Hello' },
    check: (out) => {
      expect(out['reply']).toBe('Hi there\nHow can I help?');
      expect(out['message_count']).toBe(2);
    },
  },
  {
    action: createSmsChatAction,
    props: { from_number: '+14155550100', to_number: '+14155550101', agent_id: 'agent_c' },
    response: { ...CHAT, chat_type: 'sms_chat' },
    method: 'POST',
    path: '/create-sms-chat',
    body: { from_number: '+14155550100', to_number: '+14155550101', override_agent_id: 'agent_c' },
  },
  {
    action: getChatAction,
    props: { chat_id: 'chat_1' },
    response: CHAT,
    method: 'GET',
    path: '/get-chat/chat_1',
    check: (out) => expect(out['chat_summary']).toBe('s'),
  },
  {
    action: listChatsAction,
    props: { chat_status: 'ended', chat_type: 'sms_chat' },
    response: PAGE([CHAT]),
    method: 'POST',
    path: '/v3/list-chats',
    body: {
      sort_order: 'descending',
      limit: 50,
      filter_criteria: { chat_status: { type: 'enum', op: 'in', value: ['ended'] }, chat_type: { type: 'enum', op: 'in', value: ['sms_chat'] } },
    },
    check: (out) => expect(JSON.stringify(out['items'])).not.toContain('"transcript"'),
  },
  {
    action: endChatAction,
    props: { chat_id: 'chat_1' },
    status: 204,
    method: 'PATCH',
    path: '/end-chat/chat_1',
    check: (out) => expect(out).toEqual({ chat_id: 'chat_1', ended: true }),
  },
  {
    action: listPhoneNumbersAction,
    props: { limit: 1000 },
    response: PAGE([PHONE]),
    method: 'GET',
    path: '/v2/list-phone-numbers',
    query: { limit: '1000' },
    check: (out) => {
      const items = out['items'];
      expect(Array.isArray(items) && items[0]).toMatchObject({ inbound_agent_id: 'agent_1', outbound_agent_id: 'agent_2' });
    },
  },
  {
    action: buyPhoneNumberAction,
    props: { phone_number: '+14155550199', outbound_agent_id: 'agent_2', toll_free: true },
    response: PHONE,
    status: 201,
    method: 'POST',
    path: '/create-phone-number',
    body: { phone_number: '+14155550199', outbound_agents: [{ agent_id: 'agent_2', weight: 1 }], toll_free: true },
  },
  {
    action: updatePhoneNumberAgentsAction,
    props: { phone_number: '+14155550100', inbound_agent_id: 'agent_1', inbound_agent_version: 'prod', nickname: 'Sales' },
    response: PHONE,
    method: 'PATCH',
    path: '/update-phone-number/%2B14155550100',
    body: { inbound_agents: [{ agent_id: 'agent_1', agent_version: 'prod', weight: 1 }], nickname: 'Sales' },
  },
  {
    action: deletePhoneNumberAction,
    props: { phone_number: '+14155550100' },
    status: 204,
    method: 'DELETE',
    path: '/delete-phone-number/%2B14155550100',
    check: (out) => expect(out['deleted']).toBe(true),
  },
  {
    action: listVoicesAction,
    props: { provider: 'ElevenLabs', gender: 'male', search: 'adr' },
    response: [VOICE, { ...VOICE, voice_id: 'openai-Nova', voice_name: 'Nova', provider: 'openai', gender: 'female' }],
    method: 'GET',
    path: '/list-voices',
    check: (out) => expect(out['count']).toBe(1),
  },
  { action: getVoiceByIdAction, props: { voice_id: '11labs-Adrian' }, response: VOICE, method: 'GET', path: '/get-voice/11labs-Adrian' },
  {
    action: listKnowledgeBasesAction,
    props: { search: 'doc' },
    response: [KB, { ...KB, knowledge_base_id: 'kb_2', knowledge_base_name: 'Other' }],
    method: 'GET',
    path: '/list-knowledge-bases',
    check: (out) => expect(out['count']).toBe(1),
  },
  {
    action: getKnowledgeBaseAction,
    props: { knowledge_base_id: 'knowledge_base_1' },
    response: KB,
    method: 'GET',
    path: '/get-knowledge-base/knowledge_base_1',
    check: (out) => {
      expect(out['source_count']).toBe(2);
      expect(out['sources']).toEqual([
        { source_id: 'src_1', type: 'url', title: null, url: 'https://example.com' },
        { source_id: 'src_2', type: 'text', title: 'FAQ', url: 'https://example.com/faq' },
      ]);
    },
  },
  {
    action: deleteKnowledgeBaseSourceAction,
    props: { knowledge_base_id: 'knowledge_base_1', source_id: 'src_1' },
    response: KB,
    method: 'DELETE',
    path: '/delete-knowledge-base-source/knowledge_base_1/source/src_1',
  },
  {
    action: deleteKnowledgeBaseAction,
    props: { knowledge_base_id: 'knowledge_base_1' },
    status: 204,
    method: 'DELETE',
    path: '/delete-knowledge-base/knowledge_base_1',
    check: (out) => expect(out['deleted']).toBe(true),
  },
  {
    action: listRetellLlmsAction,
    props: {},
    response: PAGE([LLM]),
    method: 'GET',
    path: '/v2/list-retell-llms',
    query: { limit: '50' },
    check: (out) => {
      const items = out['items'];
      expect(Array.isArray(items) && items[0]).toMatchObject({ knowledge_base_ids: 'kb_1, kb_2' });
    },
  },
  { action: getRetellLlmAction, props: { llm_id: 'llm_1' }, response: LLM, method: 'GET', path: '/get-retell-llm/llm_1' },
  {
    action: updateRetellLlmPromptAction,
    props: { llm_id: 'llm_1', general_prompt: 'Be brief.', model: 'gpt-4.1' },
    response: LLM,
    method: 'PATCH',
    path: '/update-retell-llm/llm_1',
    body: { general_prompt: 'Be brief.', model: 'gpt-4.1' },
  },
  {
    action: createContactAction,
    props: { phone_number: '+14155550101', first_name: 'Ann', do_not_call: false, custom_fields: { plan: 'pro' } },
    response: CONTACT,
    status: 201,
    method: 'POST',
    path: '/create-contact',
    body: { phone_number: '+14155550101', first_name: 'Ann', do_not_call: false, custom_fields: { plan: 'pro' } },
    check: (out) => expect(out['tags']).toBe('vip'),
  },
  {
    action: getContactByPhoneAction,
    props: { phone_number: '+14155550101' },
    response: CONTACT,
    method: 'GET',
    path: '/get-contact-by-phone/%2B14155550101',
    check: (out) => expect(out['found']).toBe(true),
  },
  {
    action: updateContactAction,
    props: { contact_id: 'contact_1', do_not_call: 'true', contact_memory: 'Prefers mornings' },
    response: CONTACT,
    method: 'PATCH',
    path: '/update-contact/contact_1',
    body: { do_not_call: true, contact_memory: 'Prefers mornings' },
  },
  {
    action: listContactsAction,
    props: { search: 'Ann', limit: 20 },
    response: { ...PAGE([CONTACT]), total: 1 },
    method: 'POST',
    path: '/list-contacts',
    body: { limit: 20, sort_order: 'desc', search_query: 'Ann' },
    check: (out) => expect(out['total']).toBe(1),
  },
  {
    action: getConcurrencyAction,
    props: {},
    response: { current_concurrency: 3, concurrency_limit: 20, base_concurrency: 20 },
    method: 'GET',
    path: '/get-concurrency',
    check: (out) => expect(out['available_concurrency']).toBe(17),
  },
];

describe('every action sends the documented request', () => {
  it.each(cases.map((c) => [c.action.name, c] as const))('%s', async (_name, c) => {
    const calls = stubFetch([{ status: c.status ?? 200, body: c.response }]);
    const output = await runAction({ action: c.action, props: c.props });
    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call.method).toBe(c.method);
    expect(`${call.url.origin}${call.url.pathname}`).toBe(`${BASE}${c.path}`);
    expect(Object.fromEntries(call.url.searchParams.entries())).toEqual(c.query ?? {});
    expect(call.headers['authorization']).toBe(`Bearer ${API_KEY}`);
    if (c.body !== undefined) {
      expect(call.body).toEqual(c.body);
    }
    if (c.raw === true) {
      expect(output).toEqual(c.response);
    } else if (c.action.outputSchema !== undefined) {
      const record = toRecord(output);
      for (const field of c.action.outputSchema.fields) {
        expect(Object.keys(record)).toContain(field.key);
      }
    }
    if (c.check !== undefined) {
      c.check(toRecord(output));
    }
  });

  it('covers every hand-written action of the piece', () => {
    const tested = new Set([...cases.map((c) => c.action.name), createKnowledgeBaseAction.name, addKnowledgeBaseSourcesAction.name]);
    const all = Object.keys(retellAi.actions()).filter((name) => name !== 'custom_api_call');
    expect(all.filter((name) => !tested.has(name))).toEqual([]);
  });
});

describe('knowledge base multipart actions', () => {
  it('create_knowledge_base sends multipart form with texts, urls and file', async () => {
    const calls = stubFetch([{ status: 201, body: KB }]);
    const output = await runAction({
      action: createKnowledgeBaseAction,
      props: {
        name: 'Docs',
        texts: [{ title: 'FAQ', text: 'Open 9-5' }],
        urls: ['https://example.com'],
        file: { filename: 'a"b.txt', extension: 'txt', data: Buffer.from('file body') },
      },
    });
    expect(calls[0].url.pathname).toBe('/create-knowledge-base');
    expect(calls[0].headers['content-type']).toMatch(/^multipart\/form-data; boundary=----RetellAiBoundary[0-9a-f]+$/);
    const raw = calls[0].rawBody ?? '';
    expect(raw).toContain('name="knowledge_base_name"\r\n\r\nDocs\r\n');
    expect(raw).toContain('name="knowledge_base_texts"\r\n\r\n[{"title":"FAQ","text":"Open 9-5"}]\r\n');
    expect(raw).toContain('name="knowledge_base_urls"\r\n\r\n["https://example.com"]\r\n');
    expect(raw).toContain('name="knowledge_base_files"; filename="a_b.txt"');
    expect(raw).toContain('file body');
    expect(toRecord(output)['knowledge_base_id']).toBe('knowledge_base_1');
  });

  it('add_knowledge_base_sources needs at least one source and rejects non-http URLs', async () => {
    const calls = stubFetch([]);
    await expect(runAction({ action: addKnowledgeBaseSourcesAction, props: { knowledge_base_id: 'kb' } })).rejects.toThrow(
      'Add at least one text, URL or file.',
    );
    await expect(
      runAction({ action: addKnowledgeBaseSourcesAction, props: { knowledge_base_id: 'kb', urls: ['file:///etc/passwd'] } }),
    ).rejects.toThrow('must start with http');
    expect(calls).toHaveLength(0);
  });

  it('add_knowledge_base_sources posts to the encoded knowledge base path', async () => {
    const calls = stubFetch([{ status: 201, body: KB }]);
    await runAction({ action: addKnowledgeBaseSourcesAction, props: { knowledge_base_id: 'kb 1', urls: ['https://a.example'] } });
    expect(calls[0].url.pathname).toBe('/add-knowledge-base-sources/kb%201');
  });

  it('create_knowledge_base rejects names of 40+ characters', async () => {
    stubFetch([]);
    await expect(runAction({ action: createKnowledgeBaseAction, props: { name: 'x'.repeat(40) } })).rejects.toThrow('shorter than 40');
  });
});

describe('piece metadata', () => {
  it('every action declares audience, classification, aiMetadata and outputSchema', () => {
    const actions = Object.values(retellAi.actions()).filter((action) => action.name !== 'custom_api_call');
    for (const action of actions) {
      expect(['human', 'ai', 'both']).toContain(action.audience);
      expect(['READ', 'SEARCH', 'WRITE', 'DESTRUCTIVE']).toContain(action.classification);
      expect(action.aiMetadata?.description?.length ?? 0).toBeGreaterThan(20);
      expect(typeof action.aiMetadata?.idempotent).toBe('boolean');
      expect(action.outputSchema?.fields.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('counts by audience match the plan', () => {
    const actions = Object.values(retellAi.actions()).filter((action) => action.name !== 'custom_api_call');
    const count = (audience: string) => actions.filter((action) => action.audience === audience).length;
    expect({ human: count('human'), both: count('both'), ai: count('ai') }).toEqual({ human: 5, both: 2, ai: 41 });
  });

  it('triggers are READ with aiMetadata, sample data and output schema', () => {
    const triggers = Object.values(retellAi.triggers());
    expect(triggers.map((trigger) => trigger.name).sort()).toEqual(['call_analyzed', 'call_ended', 'new_call']);
    for (const trigger of triggers) {
      expect(trigger.classification).toBe('READ');
      expect(trigger.aiMetadata?.description?.length ?? 0).toBeGreaterThan(20);
      expect(trigger.outputSchema?.fields.length ?? 0).toBeGreaterThan(0);
    }
  });
});
