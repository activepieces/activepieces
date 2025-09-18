import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

export const stripeCommon = {
  baseUrl: 'https://api.stripe.com/v1',
  subscribeWebhook: async (
    eventName: string,
    webhookUrl: string,
    apiKey: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${stripeCommon.baseUrl}/webhook_endpoints`,
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
      url: `${stripeCommon.baseUrl}/webhook_endpoints/${webhookId}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
    };
    return await httpClient.sendRequest(request);
  },
};


export const customerIdDropdown = Property.Dropdown({
  displayName: 'Customer ID',
  description: 'Select the customr',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const customers = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/customers`,
        headers: {
          Authorization: 'Bearer ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },

      });
      return {
        disabled: false,
        options: customers.body.data.map((customer: any) => ({
          label: customer.name,
          value: customer.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
})

export const productidDropdown = Property.Dropdown({
  displayName: 'Customer ID',
  description: 'Select the customr',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const products = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/products`,
        headers: {
          Authorization: 'Bearer ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },

      });
      return {
        disabled: false,
        options: products.body.data.map((product: any) => ({
          label: product.name,
          value: product.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
})

export const subscriptionIdDropdown = Property.Dropdown({
  displayName: 'Subscription ID',
  description: 'Select the customr',
  required: true,
  refreshers: ['auth', 'customerid'],
  options: async ({ auth, customerid }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }
    if (!customerid) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please select customer first',
      };
    }

    try {
      const subscriptions = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/subscriptions`,
        headers: {
          Authorization: 'Bearer ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          status: "active",
          customer: customerid
        }

      });
      return {
        disabled: false,
        options: subscriptions.body.data.map((subscription: any) => ({
          label: subscription.name,
          value: subscription.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
})


export const InvoiceIdDropdown = Property.Dropdown({
  displayName: 'Invoice ID',
  description: 'Select the Invoice',
  required: true,
  refreshers: ['auth',],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }


    try {
      const invoices = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/invoices`,
        headers: {
          Authorization: 'Bearer ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },


      });
      return {
        disabled: false,
        options: invoices.body.data.map((invoice: any) => ({
          label: invoice.customer_name,
          value: invoice.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
})



export const payoutIdDropdown=Property.Dropdown({
  displayName: 'payouts  ID',
  description: 'Select the payouts ',
  required: true,
  refreshers: ['auth',],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }


    try {
      const payouts = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/payouts`,
        headers: {
          Authorization: 'Bearer ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },


      });
      return {
        disabled: false,
        options: payouts.body.data.map((payout: any) => ({
          label: payout.id,
          value: payout.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
})

export const paymentLinkIdDropdown = Property.Dropdown({
  displayName: 'Payment Link ID',
  description: 'Select the Payment Link to deactivate',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const paymentLinks = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/payment_links`,
        headers: {
          Authorization: 'Bearer ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        disabled: false,
        options: paymentLinks.body.data.map((link: any) => ({
          label: `${link.id}`,
          value: link.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading payment links',
      };
    }
  },
});

export const chargeIdDropdown = Property.Dropdown({
  displayName: 'Charge ID',
  description: 'Select a charge to refund',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.stripe.com/v1/charges?limit=50`,
        headers: {
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        disabled: false,
        options: response.body.data.map((charge: any) => {
          const amount = (charge.amount / 100).toFixed(2) + " " + charge.currency.toUpperCase();
          const customer = charge.billing_details?.name || charge.customer || "Unknown Customer";
          const label = `${charge.id} - ${amount} (${customer})`;

          return {
            label,
            value: charge.id,
          };
        }),
        placeholder: 'Select a charge',
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading charges',
      };
    }
  },
});





