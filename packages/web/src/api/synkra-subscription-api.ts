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
  scheduledChange: { kind: 'downgrade' | 'cancel'; toTier?: string } | null;
  paystackConfigured: boolean;
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


export type SynkraAiBalance = {
  tier: string;
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  exhausted: boolean;
};

export const synkraAiApi = {
  getBalance() {
    return api.get<SynkraAiBalance>('/v1/synkra/ai/balance');
  },
};


// ---------- Add-on packs ----------
export type AddonPackKind = 'ai' | 'email';

export type AddonPack = {
  id: string;
  kind: AddonPackKind;
  amount: number;
  priceZar: number;
  label: string;
  description: string;
};

export type CreditBalance = {
  ai: number;
  email: number;
  lots: {
    id: string;
    kind: string;
    remaining: number;
    purchased: number;
    expiresAt: string;
  }[];
};

export type PurchaseResponse = {
  authorizationUrl: string;
  reference: string;
};

export const synkraCreditsApi = {
  listPacks() {
    return api.get<{ packs: AddonPack[] }>('/v1/synkra/credits/packs');
  },
  getBalance() {
    return api.get<CreditBalance>('/v1/synkra/credits/balance');
  },
  purchase(params: { packId: string; callbackUrl: string }) {
    return api.post<PurchaseResponse>('/v1/synkra/credits/purchase', params);
  },
};
