export type CreateWebhookRequest = {
  url: string;
  events: string[];
};

export type CreateWebhookResponse = {
  id: number;
  url: string;
  events: string[];
  created_at: string;
  updated_at: string;
};

export type WebhookPayload = {
  event: string;
  data: unknown;
  timestamp: string;
};

export type Call = {
  id: number;
  direction: 'inbound' | 'outbound';
  status: string;
  duration: number;
  cost: number;
  from: string;
  to: string;
  recording?: string;
  created_at: string;
  answered_at?: string;
  ended_at?: string;
  comments?: Comment[];
  tags?: Tag[];
};

export type Comment = {
  id: number;
  call_id: number;
  content: string;
  user_id: number;
  created_at: string;
};

export type Tag = {
  id: number;
  name: string;
  color: string;
};

export type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string;
  information?: string;
  emails: string[];
  phone_numbers: string[];
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: number;
  type: 'sms' | 'mms';
  direction: 'inbound' | 'outbound';
  content: string;
  from: string;
  to: string;
  status: string;
  created_at: string;
};

export type Number = {
  id: number;
  name: string;
  number: string;
  country: string;
  time_zone: string;
  created_at: string;
}; 