export interface StripeWebhookInformation {
  webhookId: string;
}

export interface StripeCustomerSearchResult {
  id: string;
  name: string | null;
  email: string | null;
}

export interface StripeProductSearchResult {
  id: string;
  name: string;
}

export interface StripePriceSearchResult {
  id: string;
  nickname: string | null;
  product: {
    name: string;
  };
}

export interface StripeSubscriptionSearchResult {
  id: string;
  customer: {
    name: string;
    email: string;
  };
}

export interface StripeInvoiceSearchResult {
  id: string;
  number: string | null;
  customer: { name: string | null; email: string | null } | null;
  total: number;
  currency: string;
}

export interface StripePaymentIntentSearchResult {
  id: string;
  amount: number;
  currency: string;
  customer: { name: string | null; email: string | null } | null;
  description: string | null;
}

export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  arrival_date: number;
  status: string;
  destination: string;
}

export interface StripePaymentLink {
  id: string;
  url: string;
}
