import type { AppConnectionType } from '@activepieces/pieces-framework';

export type PastebinAuthValue = {
  type: AppConnectionType.CUSTOM_AUTH;
  props: { token: string; username?: string; password?: string };
};

export type PastebinCreatePasteRequest = {
  paste_code: string;
  paste_private?: string;
  paste_name?: string;
  paste_expire_date?: string;
  paste_format?: string;
  folder_key?: string;
};

export type PastebinPaste = Record<string, string>;

export type PastebinAccount = Record<string, string>;
