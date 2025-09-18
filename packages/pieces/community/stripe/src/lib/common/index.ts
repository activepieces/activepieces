// src/common.ts

import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

// The base URL for all Stripe API calls
const baseUrl = 'https://api.stripe.com/v1';

export const stripeCommon = {
  baseUrl: baseUrl,

  // Webhook subscription logic (as you had it)
  subscribeWebhook: async (
    eventNames: string[],
    webhookUrl: string,
    apiKey: string
  ): Promise<{ id: string }> => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/webhook_endpoints`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: {
        enabled_events: eventNames,
        url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    };
    const { body: webhook } = await httpClient.sendRequest<{ id:string }>(request);
    return webhook;
  },

  // Webhook unsubscription logic (as you had it)
  unsubscribeWebhook: async (webhookId: string, apiKey: string) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${baseUrl}/webhook_endpoints/${webhookId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    };
    return await httpClient.sendRequest(request);
  },
};

// --- TYPE DEFINITIONS ---
// Centralized types for Stripe API responses.

export interface StripeCustomer {
  id: string;
  name: string | null;
  email: string | null;
}

export interface StripeProduct {
  id: string;
  name: string;
}

export interface StripePrice {
  id: string;
  nickname: string | null;
  product: {
    name: string;
  };
  unit_amount: number;
  currency: string;
}

export interface StripeSubscription {
  id: string;
  customer: {
    name: string;
    email: string;
  };
}

export interface StripeInvoice {
  id: string;
  number: string | null;
  customer: { name: string | null; email: string | null } | null;
  total: number;
  currency: string;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  customer: { name: string | null; email: string | null } | null;
}

export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  arrival_date: number;
  status: string;
}

export interface StripePaymentLink {
  id: string;
  url: string;
}

export interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  customer: { name: string | null; email: string | null } | null;
  created: number; // This is a Unix timestamp
}