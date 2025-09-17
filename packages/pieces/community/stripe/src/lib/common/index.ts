import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { Property, DropdownState } from '@activepieces/pieces-framework';
import {
  StripeCustomerSearchResult,
  StripeInvoiceSearchResult,
  StripePaymentIntentSearchResult,
  StripePaymentLink,
  StripePayout,
  StripeProductSearchResult,
} from './types';

const baseUrl = 'https://api.stripe.com/v1';

export const stripeCommon = {
  baseUrl: baseUrl,

  subscribeWebhook: async (
    eventName: string,
    webhookUrl: string,
    apiKey: string
  ): Promise<{ id: string }> => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/webhook_endpoints`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        enabled_events: [eventName],
        url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      queryParams: {},
    };

    const { body: webhook } = await httpClient.sendRequest<{ id: string }>(
      request
    );
    return webhook;
  },

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

  invoice: Property.Dropdown({
    displayName: 'Invoice',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      const response = await httpClient.sendRequest<{
        data: StripeInvoiceSearchResult[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/invoices/search`, 
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          query: `status:'open' AND (customer.name~"${
            searchValue || ''
          }" OR number~"${searchValue || ''}")`,
          expand: 'data.customer',
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map(
            (invoice: StripeInvoiceSearchResult) => {
              const customerName =
                invoice.customer?.name ||
                invoice.customer?.email ||
                'Unknown Customer';
              const amount = (invoice.total / 100).toFixed(2);
              const label = `Invoice #${
                invoice.number
              } for ${customerName} (${amount} ${invoice.currency.toUpperCase()})`;
              return {
                value: invoice.id,
                label: label,
              };
            }
          ),
        };
      }
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load invoices",
      };
    },
  }),

  customer: Property.Dropdown({
    displayName: 'Customer',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }

      const response = await httpClient.sendRequest<{
        data: StripeCustomerSearchResult[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/customers/search`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          query: `name~"${searchValue || ''}" OR email~"${searchValue || ''}"`,
        },
      });

      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map(
            (customer: StripeCustomerSearchResult) => {
              return {
                value: customer.id,
                label: `${customer.name || customer.id} (${
                  customer.email || 'No Email'
                })`,
              };
            }
          ),
        };
      }

      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load customers",
      };
    },
  }),

  product: Property.Dropdown({
    displayName: 'Product',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }

      const response = await httpClient.sendRequest<{
        data: StripeProductSearchResult[];
      }>({
        method: HttpMethod.GET,
        url: `${stripeCommon.baseUrl}/products/search`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          query: `active:'true' AND name~"${searchValue || ''}"`,
        },
      });

      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((prod: StripeProductSearchResult) => {
            return {
              value: prod.id,
              label: prod.name,
            };
          }),
        };
      }

      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load products",
      };
    },
  }),

  price: Property.Dropdown({
    displayName: 'Price',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      const response = await httpClient.sendRequest<{
        data: {
          id: string;
          nickname: string | null;
          product: { name: string };
        }[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/prices/search`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          query: `active:'true' AND type:'recurring' AND (product.name~"${
            searchValue || ''
          }" OR nickname~"${searchValue || ''}")`,
          expand: 'data.product',
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((price) => {
            const label = price.nickname
              ? `${price.nickname} (${price.product.name})`
              : price.product.name;
            return {
              value: price.id,
              label: label,
            };
          }),
        };
      }
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load prices",
      };
    },
  }),

  subscription: Property.Dropdown({
    displayName: 'Subscription',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      const response = await httpClient.sendRequest<{
        data: { id: string; customer: { name: string; email: string } }[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/subscriptions/search`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          query: `status:'active' AND customer.name~"${searchValue || ''}"`,
          expand: 'data.customer',
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((sub) => {
            const customerInfo = sub.customer
              ? `${sub.customer.name} (${sub.customer.email})`
              : 'Unknown Customer';
            return {
              value: sub.id,
              label: `Subscription for ${customerInfo}`,
            };
          }),
        };
      }
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load subscriptions",
      };
    },
  }),

  payout: Property.Dropdown({
    displayName: 'Payout',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      const response = await httpClient.sendRequest<{ data: StripePayout[] }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/payouts`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          limit: '100',
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((payout) => {
            const arrivalDate = new Date(
              payout.arrival_date * 1000
            ).toLocaleDateString();
            const amount = (payout.amount / 100).toFixed(2);
            const label = `Payout on ${arrivalDate} - ${amount} ${payout.currency.toUpperCase()} (${
              payout.status
            })`;
            return {
              value: payout.id,
              label: label,
            };
          }),
        };
      }
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load payouts",
      };
    },
  }),

  paymentIntent: Property.Dropdown({
    displayName: 'Payment Intent',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      const response = await httpClient.sendRequest<{
        data: StripePaymentIntentSearchResult[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/payment_intents/search`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          query: `status:'succeeded' AND (customer.name~"${
            searchValue || ''
          }" OR customer.email~"${searchValue || ''}")`,
          expand: 'data.customer',
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((intent) => {
            const customerInfo =
              intent.customer?.name ||
              intent.customer?.email ||
              'Unknown Customer';
            const amount = (intent.amount / 100).toFixed(2);
            const label = `Payment from ${customerInfo} - ${amount} ${intent.currency.toUpperCase()}`;
            return {
              value: intent.id,
              label: label,
            };
          }),
        };
      }
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load payment intents",
      };
    },
  }),

  paymentLink: Property.Dropdown({
    displayName: 'Payment Link',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your account',
        };
      }
      const response = await httpClient.sendRequest<{
        data: StripePaymentLink[];
      }>({
        method: HttpMethod.GET,
        url: `${baseUrl}/payment_links`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          active: 'true',
          limit: '100',
        },
      });
      if (response.status === 200) {
        return {
          disabled: false,
          options: response.body.data.map((link) => {
            return {
              value: link.id,
              label: link.url,
            };
          }),
        };
      }
      return {
        disabled: true,
        options: [],
        placeholder: "Couldn't load payment links",
      };
    },
  }),
};