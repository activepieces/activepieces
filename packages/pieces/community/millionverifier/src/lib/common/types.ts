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
