export const CALL = {
  call_type: 'phone_call',
  call_id: 'call_1',
  agent_id: 'agent_1',
  agent_name: 'Setter',
  agent_version: 2,
  call_status: 'ended',
  direction: 'outbound',
  from_number: '+14155550100',
  to_number: '+14155550101',
  start_timestamp: 1703302407333,
  end_timestamp: 1703302428855,
  duration_ms: 21522,
  disconnection_reason: 'user_hangup',
  transcript: 'Agent: hi',
  recording_url: 'https://example.com/rec.wav',
  public_log_url: 'https://example.com/log.txt',
  metadata: { crm: '1' },
  retell_llm_dynamic_variables: { name: 'Ann' },
  call_analysis: {
    call_summary: 'Confirmed.',
    user_sentiment: 'Positive',
    call_successful: true,
    in_voicemail: false,
    custom_analysis_data: { ok: true },
  },
  call_cost: { combined_cost: 7.1 },
  telephony_identifier: { twilio_call_sid: 'CA1' },
};

export const CHAT = {
  chat_id: 'chat_1',
  agent_id: 'agent_c',
  version: 1,
  chat_status: 'ongoing',
  chat_type: 'api_chat',
  start_timestamp: 1703302407333,
  transcript: 'User: hi',
  chat_analysis: { chat_summary: 's', user_sentiment: 'Neutral', chat_successful: true },
  chat_cost: { combined_cost: 1 },
  metadata: {},
};

export const AGENT = {
  agent_id: 'agent_1',
  agent_name: 'Setter',
  version: 3,
  is_published: false,
  voice_id: '11labs-Adrian',
  language: 'en-US',
  webhook_url: null,
  response_engine: { type: 'retell-llm', llm_id: 'llm_1', version: 3 },
  last_modification_timestamp: 1703413636133,
};

export const PHONE = {
  phone_number: '+14155550100',
  phone_number_pretty: '(415) 555-0100',
  phone_number_type: 'retell-twilio',
  nickname: 'Main',
  area_code: 415,
  inbound_agents: [{ agent_id: 'agent_1', weight: 1 }],
  outbound_agents: [{ agent_id: 'agent_2', agent_version: 2, weight: 1 }],
  last_modification_timestamp: 1703413636133,
};

export const VOICE = {
  voice_id: '11labs-Adrian',
  voice_name: 'Adrian',
  provider: 'elevenlabs',
  accent: 'American',
  gender: 'male',
  age: 'Young',
  preview_audio_url: 'https://example.com/a.mp3',
};

export const KB = {
  knowledge_base_id: 'knowledge_base_1',
  knowledge_base_name: 'Docs',
  status: 'in_progress',
  enable_auto_refresh: false,
  knowledge_base_sources: [
    { type: 'url', source_id: 'src_1', url: 'https://example.com' },
    { type: 'text', source_id: 'src_2', title: 'FAQ', content_url: 'https://example.com/faq' },
  ],
};

export const LLM = {
  llm_id: 'llm_1',
  version: 1,
  is_published: true,
  model: 'gpt-4.1',
  general_prompt: 'You are helpful.',
  begin_message: 'Hi',
  knowledge_base_ids: ['kb_1', 'kb_2'],
  last_modification_timestamp: 1703413636133,
};

export const CONTACT = {
  contact_id: 'contact_1',
  phone_number: '+14155550101',
  first_name: 'Ann',
  last_name: 'Lee',
  do_not_call: false,
  contact_tags: [{ id: 't1', label: 'vip' }],
  custom_fields: { plan: 'pro' },
  conversation_count: 2,
  created_timestamp: 1703413636133,
};
