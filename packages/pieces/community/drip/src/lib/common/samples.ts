const subscriber = {
  id: 'o0csqd1jqiez381idl4o',
  status: 'active',
  deliverable: true,
  email: 'john@example.com',
  custom_fields: { first_name: 'John' },
  tags: ['Customer'],
  time_zone: null,
  utc_offset: 0,
  created_at: '2026-10-06T15:52:58Z',
  ip_address: null,
  user_agent: null,
  lifetime_value: null,
  original_referrer: null,
  landing_url: null,
  prospect: false,
  base_lead_score: null,
  lead_score: null,
  user_id: null,
};

function event({ name, properties = {} }: { name: string; properties?: Record<string, unknown> }): Record<string, unknown> {
  return {
    event: name,
    data: {
      subscriber,
      properties: { ...properties, source: 'drip' },
      account_id: '9999999',
    },
    occurred_at: '2026-10-06T15:52:58Z',
  };
}

export const dripSamples = {
  subscriber,
  event,
};
