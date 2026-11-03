export type ProweblookOperation =
  | 'get_balance'
  | 'verify_email'
  | 'validate_phone'
  | 'check_whatsapp';

export type ProweblookErrorDetail = {
  code?: string;
  message?: string;
};

export type ProweblookEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: ProweblookErrorDetail;
};

export type CreditPoolBalance = {
  amount: number;
  unlimited: boolean;
};

export type GetBalanceData = {
  account_email: string;
  email: CreditPoolBalance;
  phone: CreditPoolBalance;
  whatsapp: CreditPoolBalance;
};

export type VerifyEmailData = {
  email: string;
  verdict: 'deliverable' | 'undeliverable' | 'unknown';
  reason: string;
  billing_status: string;
  details?: Record<string, unknown>;
};

export type ValidatePhoneData = {
  verdict: 'valid' | 'invalid' | 'unknown';
  reason: string;
  billing_status: string;
  details?: Record<string, unknown>;
};

export type CheckWhatsappData = {
  verdict: 'on_whatsapp' | 'not_on_whatsapp';
  reason: string;
  billing_status: string;
  details?: Record<string, unknown>;
};
