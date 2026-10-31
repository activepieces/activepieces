import type { AppConnectionType } from '@activepieces/pieces-framework';

export type SendfoxAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type SendfoxList = { id: number; name: string };

export type SendfoxPage<T> = {
  current_page?: number;
  data: T[];
  last_page: number;
};

export type SendfoxContact = {
  id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  ip_address?: string | null;
  unsubscribed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type SendfoxTag = {
  id: number;
  user_id?: number;
  name: string;
  color?: string | null;
  contacts_count?: number;
  created_at?: string;
  updated_at?: string;
};
