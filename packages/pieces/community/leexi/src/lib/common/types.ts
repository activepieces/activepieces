export type LeexiPagination = {
  page: number;
  items: number;
  count: number;
  pages: number;
};

export type LeexiListResponse<T> = {
  data: T[];
  pagination: LeexiPagination;
};

export type LeexiUserRef = {
  uuid: string;
  name: string | null;
  email: string | null;
};

export type LeexiCustomer = {
  uuid: string;
  name: string | null;
  email: string | null;
  phone_number: string | null;
};

export type LeexiSpeaker = {
  uuid: string;
  index: number;
  name: string | null;
  email_address: string | null;
  phone_number: string | null;
  is_user: boolean;
  duration?: number;
  longest_monologue?: number;
};

export type LeexiCall = {
  uuid: string;
  title?: string | null;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  performed_at?: string | null;
  duration?: number | null;
  direction?: string | null;
  locale?: string | null;
  is_video?: boolean;
  source?: string | null;
  source_id?: string | null;
  leexi_url?: string | null;
  conversation_type?: { uuid: string; slug: string; active: boolean } | null;
  owner?: LeexiUserRef | null;
  participating_users?: LeexiUserRef[];
  customers?: LeexiCustomer[];
  customer_email_addresses?: string[];
  customer_phone_numbers?: string[];
  summary?: string | null;
  simple_transcript?: string | null;
  speakers?: LeexiSpeaker[];
  tasks?: unknown[];
  prompts?: unknown[];
  chapters?: unknown[];
  scorecards?: unknown[];
};

export type LeexiCallNote = {
  uuid: string;
  created_at: string;
  updated_at: string;
  prompt: { uuid: string; title: string; category: string } | null;
  translations: Array<{ uuid: string; locale: string; text: string; original_text: string; updated_at: string }>;
};

export type LeexiUser = {
  uuid: string;
  name: string;
  email: string;
  active: boolean;
  license: string | null;
  roles: string[];
  team: { uuid: string; name: string; active: boolean } | null;
  created_at: string;
  updated_at: string;
};

export type LeexiMeetingEvent = Record<string, unknown>;
