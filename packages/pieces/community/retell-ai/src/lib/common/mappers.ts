import { isRecord } from './client';

export const retellMap = {
  str,
  num,
  rec,
  itemsOf,
  page,
  call,
  webCall,
  chat,
  chatListItem,
  chatCompletion,
  agent,
  chatAgent,
  agentListItem,
  agentVersion,
  phoneNumber,
  voice,
  knowledgeBase,
  retellLlm,
  contact,
  concurrency,
  batchCall,
};

function str(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function rec(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function objOrNull(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function iso(value: unknown): string | null {
  const ms = num(value);
  if (ms === null) {
    return null;
  }
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function itemsOf(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  const record = rec(body);
  if (Array.isArray(record['items'])) {
    return record['items'];
  }
  if (Array.isArray(record['data'])) {
    return record['data'];
  }
  return [];
}

function page<T>({ body, mapItem }: { body: unknown; mapItem: (item: unknown) => T }): RetellPage<T> {
  const record = rec(body);
  const items = itemsOf(body).map(mapItem);
  const paginationKey = str(record['pagination_key']);
  const hasMore = bool(record['has_more']);
  return {
    items,
    count: items.length,
    pagination_key: paginationKey,
    has_more: hasMore ?? false,
    total: num(record['total']),
  };
}

function agentWeights(value: unknown): AgentWeight[] {
  return list(value).map((entry) => {
    const item = rec(entry);
    return {
      agent_id: str(item['agent_id']),
      agent_version: str(item['agent_version']),
      weight: num(item['weight']),
    };
  });
}

function call(body: unknown) {
  const c = rec(body);
  const analysis = rec(c['call_analysis']);
  const cost = rec(c['call_cost']);
  const telephony = rec(c['telephony_identifier']);
  return {
    call_id: str(c['call_id']),
    call_type: str(c['call_type']),
    call_status: str(c['call_status']),
    direction: str(c['direction']),
    from_number: str(c['from_number']),
    to_number: str(c['to_number']),
    agent_id: str(c['agent_id']),
    agent_name: str(c['agent_name']),
    agent_version: str(c['agent_version']),
    batch_call_id: str(c['batch_call_id']),
    start_timestamp: num(c['start_timestamp']),
    start_time: iso(c['start_timestamp']),
    end_timestamp: num(c['end_timestamp']),
    end_time: iso(c['end_timestamp']),
    duration_ms: num(c['duration_ms']),
    disconnection_reason: str(c['disconnection_reason']),
    transcript: str(c['transcript']),
    recording_url: str(c['recording_url']),
    public_log_url: str(c['public_log_url']),
    call_summary: str(analysis['call_summary']),
    user_sentiment: str(analysis['user_sentiment']),
    call_successful: bool(analysis['call_successful']),
    in_voicemail: bool(analysis['in_voicemail']),
    custom_analysis_data: objOrNull(analysis['custom_analysis_data']),
    combined_cost_cents: num(cost['combined_cost']),
    metadata: objOrNull(c['metadata']),
    dynamic_variables: objOrNull(c['retell_llm_dynamic_variables']),
    collected_dynamic_variables: objOrNull(c['collected_dynamic_variables']),
    twilio_call_sid: str(telephony['twilio_call_sid']),
  };
}

function webCall(body: unknown) {
  const c = rec(body);
  return {
    call_id: str(c['call_id']),
    access_token: str(c['access_token']),
    expires_at: str(c['expires_at']) ?? iso(c['expires_at']),
  };
}

function chatMessage(entry: unknown) {
  const m = rec(entry);
  return {
    message_id: str(m['message_id']),
    role: str(m['role']),
    content: str(m['content']),
    created_timestamp: num(m['created_timestamp']),
  };
}

function chat(body: unknown) {
  const c = rec(body);
  const analysis = rec(c['chat_analysis']);
  const cost = rec(c['chat_cost']);
  return {
    chat_id: str(c['chat_id']),
    agent_id: str(c['agent_id']),
    agent_version: str(c['version']),
    chat_status: str(c['chat_status']),
    chat_type: str(c['chat_type']),
    start_timestamp: num(c['start_timestamp']),
    start_time: iso(c['start_timestamp']),
    end_timestamp: num(c['end_timestamp']),
    end_time: iso(c['end_timestamp']),
    transcript: str(c['transcript']),
    chat_summary: str(analysis['chat_summary']),
    user_sentiment: str(analysis['user_sentiment']),
    chat_successful: bool(analysis['chat_successful']),
    custom_analysis_data: objOrNull(analysis['custom_analysis_data']),
    combined_cost_cents: num(cost['combined_cost']),
    metadata: objOrNull(c['metadata']),
  };
}

function chatListItem(body: unknown) {
  const { transcript: _transcript, ...rest } = chat(body);
  return rest;
}

function chatCompletion(body: unknown) {
  const messages = list(rec(body)['messages']).map(chatMessage);
  const agentReplies = messages.filter((message) => message.role === 'agent' && message.content !== null);
  return {
    messages,
    reply: agentReplies.map((message) => message.content).join('\n'),
    message_count: messages.length,
  };
}

function responseEngine(value: unknown) {
  const engine = rec(value);
  return {
    response_engine_type: str(engine['type']),
    llm_id: str(engine['llm_id']),
    conversation_flow_id: str(engine['conversation_flow_id']),
  };
}

function agent(body: unknown) {
  const a = rec(body);
  return {
    agent_id: str(a['agent_id']),
    agent_name: str(a['agent_name']),
    version: num(a['version']),
    is_published: bool(a['is_published']),
    voice_id: str(a['voice_id']),
    language: str(a['language']),
    webhook_url: str(a['webhook_url']),
    ...responseEngine(a['response_engine']),
    last_modification_timestamp: num(a['last_modification_timestamp']),
    last_modified_time: iso(a['last_modification_timestamp']),
  };
}

function chatAgent(body: unknown) {
  const a = rec(body);
  return {
    agent_id: str(a['agent_id']),
    agent_name: str(a['agent_name']),
    version: num(a['version']),
    is_published: bool(a['is_published']),
    language: str(a['language']),
    webhook_url: str(a['webhook_url']),
    ...responseEngine(a['response_engine']),
    last_modification_timestamp: num(a['last_modification_timestamp']),
    last_modified_time: iso(a['last_modification_timestamp']),
  };
}

function agentListItem(body: unknown) {
  const a = rec(body);
  return {
    agent_id: str(a['agent_id']),
    agent_name: str(a['agent_name']),
    channel: str(a['channel']),
    version: num(a['version']),
    is_published: bool(a['is_published']),
    last_modified_time: iso(a['user_modified_timestamp'] ?? a['last_modification_timestamp']),
  };
}

function agentVersion(body: unknown) {
  const v = rec(body);
  return {
    version: num(v['version']),
    is_published: bool(v['is_published']),
    version_title: str(v['version_title']),
    version_description: str(v['version_description']),
    base_version: num(v['base_version']),
    last_modified_time: iso(v['last_modification_timestamp']),
  };
}

function phoneNumber(body: unknown) {
  const p = rec(body);
  const inbound = agentWeights(p['inbound_agents']);
  const outbound = agentWeights(p['outbound_agents']);
  return {
    phone_number: str(p['phone_number']),
    phone_number_pretty: str(p['phone_number_pretty']),
    phone_number_type: str(p['phone_number_type']),
    nickname: str(p['nickname']),
    area_code: num(p['area_code']),
    inbound_agent_id: inbound[0]?.agent_id ?? str(p['inbound_agent_id']),
    outbound_agent_id: outbound[0]?.agent_id ?? str(p['outbound_agent_id']),
    inbound_agents: inbound,
    outbound_agents: outbound,
    inbound_webhook_url: str(p['inbound_webhook_url']),
    last_modified_time: iso(p['last_modification_timestamp']),
  };
}

function voice(body: unknown) {
  const v = rec(body);
  return {
    voice_id: str(v['voice_id']),
    voice_name: str(v['voice_name']),
    provider: str(v['provider']),
    accent: str(v['accent']),
    gender: str(v['gender']),
    age: str(v['age']),
    preview_audio_url: str(v['preview_audio_url']),
  };
}

function knowledgeBase(body: unknown) {
  const k = rec(body);
  const sources = list(k['knowledge_base_sources']).map((entry) => {
    const s = rec(entry);
    return {
      source_id: str(s['source_id']),
      type: str(s['type']),
      title: str(s['title']) ?? str(s['filename']),
      url: str(s['url']) ?? str(s['file_url']) ?? str(s['content_url']),
    };
  });
  return {
    knowledge_base_id: str(k['knowledge_base_id']),
    knowledge_base_name: str(k['knowledge_base_name']),
    status: str(k['status']),
    enable_auto_refresh: bool(k['enable_auto_refresh']),
    source_count: sources.length,
    sources,
    last_refreshed_time: iso(k['last_refreshed_timestamp']),
  };
}

function retellLlm(body: unknown) {
  const l = rec(body);
  const kbIds = list(l['knowledge_base_ids']).filter((id): id is string => typeof id === 'string');
  return {
    llm_id: str(l['llm_id']),
    version: num(l['version']),
    is_published: bool(l['is_published']),
    model: str(l['model']),
    start_speaker: str(l['start_speaker']),
    general_prompt: str(l['general_prompt']),
    begin_message: str(l['begin_message']),
    knowledge_base_ids: kbIds.join(', '),
    last_modified_time: iso(l['last_modification_timestamp']),
  };
}

function contact(body: unknown) {
  const c = rec(body);
  const tags = list(c['contact_tags'])
    .map((entry) => str(rec(entry)['label']))
    .filter((label): label is string => label !== null);
  return {
    contact_id: str(c['contact_id']),
    phone_number: str(c['phone_number']),
    first_name: str(c['first_name']),
    last_name: str(c['last_name']),
    do_not_call: bool(c['do_not_call']),
    contact_memory: str(c['contact_memory']),
    external_id: str(c['external_id']),
    tags: tags.join(', '),
    custom_fields: objOrNull(c['custom_fields']),
    conversation_count: num(c['conversation_count']),
    last_conversation_time: iso(c['last_conversation_timestamp']),
    created_time: iso(c['created_timestamp']),
  };
}

function concurrency(body: unknown) {
  const c = rec(body);
  const current = num(c['current_concurrency']);
  const limit = num(c['concurrency_limit']);
  return {
    current_concurrency: current,
    concurrency_limit: limit,
    available_concurrency: current !== null && limit !== null ? Math.max(limit - current, 0) : null,
    base_concurrency: num(c['base_concurrency']),
    purchased_concurrency: num(c['purchased_concurrency']),
    reserved_inbound_concurrency: num(c['reserved_inbound_concurrency']),
    concurrency_burst_enabled: bool(c['concurrency_burst_enabled']),
  };
}

function batchCall(body: unknown) {
  const b = rec(body);
  return {
    batch_call_id: str(b['batch_call_id']),
    name: str(b['name']),
    from_number: str(b['from_number']),
    scheduled_timestamp: num(b['scheduled_timestamp']),
    scheduled_time: iso(b['scheduled_timestamp']),
    total_task_count: num(b['total_task_count']),
  };
}

export type RetellPage<T> = {
  items: T[];
  count: number;
  pagination_key: string | null;
  has_more: boolean;
  total: number | null;
};

type AgentWeight = { agent_id: string | null; agent_version: string | null; weight: number | null };
