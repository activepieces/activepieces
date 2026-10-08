import { api } from '@/lib/api';

export type SynkraTier = 'free' | 'starter' | 'business' | 'pro';

export type SynkraSubscription = {
  tier: SynkraTier;
  status: string;
  priceZar: number;
  studentVerified: boolean;
  communityVerified: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  limits: Record<string, unknown>;
};

export type SynkraUsage = {
  aiOpsUsed: number;
  smsUsed: number;
  whatsappUsed: number;
  voiceMinutesUsed: number;
  emailsUsed: number;
  storageBytesUsed: number;
  usagePeriodStart: string | null;
  usagePeriodEnd: string | null;
};

export type CheckoutResponse = {
  authorizationUrl: string;
  reference: string;
  accessCode: string;
};

export const synkraSubscriptionApi = {
  get() {
    return api.get<SynkraSubscription>('/v1/synkra/subscription');
  },
  getUsage() {
    return api.get<SynkraUsage>('/v1/synkra/subscription/usage');
  },
  checkout(params: {
    tier: 'starter' | 'business' | 'pro';
    callbackUrl: string;
  }) {
    return api.post<CheckoutResponse>('/v1/synkra/subscription/checkout', params);
  },
};
