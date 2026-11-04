import type { AppConnectionType } from '@activepieces/pieces-framework';

export type MillionVerifierAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type MillionVerifierVerifyResult = {
  email?: string;
  quality?: string;
  result?: string;
  resultcode?: number;
  subresult?: string;
  free?: boolean;
  role?: boolean;
  didyoumean?: string;
  credits?: number;
  executiontime?: number;
  error?: string;
  livemode?: boolean;
};

export type MillionVerifierCredits = {
  credits?: number;
  bulk_credits?: number;
  renewing_credits?: number;
  plan?: number;
};

export type MillionVerifierBulkFile = {
  file_id?: string | number;
  file_name?: string;
  status?: string;
  unique_emails?: number;
  updated_at?: string;
  createdate?: string;
  percent?: number;
  total_rows?: number;
  verified?: number;
  unverified?: number;
  ok?: number;
  catch_all?: number;
  disposable?: number;
  invalid?: number;
  unknown?: number;
  reverify?: number;
  credit?: number;
  estimated_time_sec?: number;
  error?: string;
};

export type MillionVerifierFileList = {
  files?: MillionVerifierBulkFile[];
  total?: number;
};

export type MillionVerifierResult = {
  result?: string;
  error?: string;
};
