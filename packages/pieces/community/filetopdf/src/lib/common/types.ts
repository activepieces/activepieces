import type { AppConnectionType } from '@activepieces/pieces-framework';

export type FiletopdfAuthValue = { type: AppConnectionType.SECRET_TEXT; secret_text: string };

export type FiletopdfPdfEnvelope = {
  status: string;
  data?: {
    pdf?: string;
    filename?: string;
    pages?: number;
    size_bytes?: number;
    credits_used?: number;
    credits_remaining?: number;
  };
};

export type FiletopdfAccount = {
  workspace_id: string;
  plan: string;
  credits_remaining: number;
  subscription_status: string;
};

export type FiletopdfAccountEnvelope = {
  status: string;
  data?: FiletopdfAccount;
};

export type FiletopdfConversionOutput = {
  file: string;
  filename: string;
  pages: number | undefined;
  fileSize: number | undefined;
  creditsUsed: number | undefined;
  creditsRemaining: number | undefined;
};

export type FiletopdfApiError = {
  code?: string;
  message?: string;
  upgrade_url?: string;
  parameter?: string;
  remaining?: number;
  concurrent_limit?: number;
};
