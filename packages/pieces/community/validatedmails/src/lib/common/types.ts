export type ValidationStatus = 'valid' | 'invalid' | 'unknown';

export type ValidatedMailsValidationResponse = {
  is_valid: boolean;
  score: number;
  email: string;
  normalized: string;
  state: string;
  reason: string;
  domain: string;
  free: boolean;
  role: boolean;
  disposable: boolean;
  accept_all: boolean;
  tag: boolean;
  smtp_ok: boolean;
  mx_record?: string;
  syntax_ok: boolean;
  mx_ok: boolean;
  a_ok: boolean;
  response_ms: number;
  mx_hosts: string[];
  status: ValidationStatus;
  reasons: string[];
  trace_id: string;
};

export type ValidateEmailProps = {
  email: string;
  dnsTimeoutMs?: number;
  mode: 'POST' | 'GET';
};
