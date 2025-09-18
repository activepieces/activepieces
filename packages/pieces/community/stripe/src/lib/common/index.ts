import {
    HttpRequest,
    HttpMethod,
    httpClient,
    AuthenticationType, // Added for cleaner authentication
} from '@activepieces/pieces-common';
import { Property, DropdownState } from '@activepieces/pieces-framework';

// --- TYPE DEFINITIONS ---
// Added for type safety with Stripe API responses
interface StripeCustomer { id: string; name: string | null; email: string | null; }
interface StripeProduct { id: string; name: string; }
interface StripeSubscription { id: string; }
interface StripeInvoice { id: string; number: string; total: number; currency: string; customer: StripeCustomer | null; }
interface StripePayout { id: string; amount: number; arrival_date: number; currency: string; status: string; }
// --- END OF TYPES ---

export const stripeCommon = {
    baseUrl: 'https://api.stripe.com/v1',

    async subscribeWebhook(events: string[], webhookUrl: string, auth: string) {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${this.baseUrl}/webhook_endpoints`,
            headers: {
                'Authorization': 'Bearer ' + auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: {
                'enabled_events': events,
                'url': webhookUrl,
                'api_version': '2024-04-10',
            },
        };
        const response = await httpClient.sendRequest<{ id: string }>(request);
        return response.body;
    },

    async unsubscribeWebhook(webhookId: string, auth: string) {
        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${this.baseUrl}/webhook_endpoints/${webhookId}`,
            headers: {
                'Authorization': 'Bearer ' + auth,
            },
        };
        return await httpClient.sendRequest(request);
    },
};

// --- HIGH-PERFORMANCE DROPDOWNS ---

export const customerIdDropdown = Property.Dropdown({
    displayName: 'Customer',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };

        const response = await httpClient.sendRequest<{ data: StripeCustomer[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/customers/search`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: { query: `name~"${searchValue || ''}" OR email~"${searchValue || ''}"` },
        });

        return {
            disabled: false,
            options: response.body.data.map((customer) => ({
                value: customer.id,
                label: `${customer.name || 'Untitled'} (${customer.email || 'No Email'})`,
            })),
        };
    },
});

export const productIdDropdown = Property.Dropdown({
    displayName: 'Product',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };

        const response = await httpClient.sendRequest<{ data: StripeProduct[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/products/search`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: { query: `active:'true' AND name~"${searchValue || ''}"` },
        });

        return {
            disabled: false,
            options: response.body.data.map((prod) => ({
                value: prod.id,
                label: prod.name,
            })),
        };
    },
});

export const subscriptionIdDropdown = Property.Dropdown({
    displayName: 'Subscription',
    required: true,
    refreshers: ['customerId'],
    options: async ({ auth, customerId }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };
        if (!customerId) return { disabled: true, options: [], placeholder: 'Please select a customer first' };

        const response = await httpClient.sendRequest<{ data: StripeSubscription[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/subscriptions`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: {
                limit: '100',
                status: 'active',
                customer: customerId as string
            }
        });

        return {
            disabled: false,
            options: response.body.data.map((sub) => ({
                value: sub.id,
                label: `Subscription ID: ${sub.id}`,
            })),
        };
    },
});

export const invoiceIdDropdown = Property.Dropdown({
    displayName: "Invoice",
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };

        const response = await httpClient.sendRequest<{ data: StripeInvoice[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/invoices/search`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: {
                query: `status:'open' AND (customer.name~"${searchValue || ''}" OR number~"${searchValue || ''}")`,
                'expand[0]': 'data.customer',
            },
        });

        return {
            disabled: false,
            options: response.body.data.map((invoice) => {
                const customerName = invoice.customer?.name || invoice.customer?.email || 'Unknown';
                const amount = (invoice.total / 100).toFixed(2);
                const label = `Invoice #${invoice.number || invoice.id} for ${customerName} (${amount} ${invoice.currency.toUpperCase()})`;
                return { value: invoice.id, label };
            }),
        };
    },
});

export const payoutIdDropdown = Property.Dropdown({
    displayName: 'Payout',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };

        const response = await httpClient.sendRequest<{ data: StripePayout[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/payouts`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: { limit: '100' },
        });

        return {
            disabled: false,
            options: response.body.data.map((payout) => {
                const arrivalDate = new Date(payout.arrival_date * 1000).toLocaleDateString();
                const amount = (payout.amount / 100).toFixed(2);
                const label = `Payout on ${arrivalDate} - ${amount} ${payout.currency.toUpperCase()} (${payout.status})`;
                return { value: payout.id, label };
            }),
        };
    },
});

// ADDED: chargeIdDropdown
export const chargeIdDropdown = Property.Dropdown({
    displayName: 'Charge',
    required: true,
    refreshers: ['customerId'],
    options: async ({ auth, customerId }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };
        if (!customerId) return { disabled: true, options: [], placeholder: 'Please select a customer first' };

        const response = await httpClient.sendRequest<{ data: { id: string, amount: number, currency: string, created: number }[] }>({
            method: HttpMethod.GET,
            url: `https://api.stripe.com/v1/charges`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: {
                limit: '100',
                customer: customerId as string
            }
        });
        return {
            disabled: false,
            options: response.body.data.map((charge) => {
                const amount = (charge.amount / 100).toFixed(2);
                const createdDate = new Date(charge.created * 1000).toLocaleDateString();
                return {
                    value: charge.id,
                    label: `${amount} ${charge.currency.toUpperCase()} on ${createdDate}`,
                };
            }),
        };
    },
});

// ADDED: paymentLinkIdDropdown
export const paymentLinkIdDropdown = Property.Dropdown({
    displayName: 'Payment Link',
    description: 'Select an active payment link.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };

        const response = await httpClient.sendRequest<{ data: { id: string, url: string }[] }>({
            method: HttpMethod.GET,
            url: `https://api.stripe.com/v1/payment_links`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: { limit: '100', active: 'true' }
        });
        return {
            disabled: false,
            options: response.body.data.map((link) => ({
                value: link.id,
                label: link.url,
            })),
        };
    },
});