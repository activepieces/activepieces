// src/common/props.ts
// 
console.log("--- Using HIGH-PERFORMANCE props file! ---"); 



import { Property, DropdownState } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";
import { stripeCommon, StripeCustomer, StripeProduct, StripeSubscription, StripeInvoice, StripePayout } from ".";

// NOTE: This file uses the modern, high-performance Stripe Search API to prevent timeouts.

export const customerIdDropdown = Property.Dropdown({
    displayName: 'Customer',
    required: true,
    refreshers: [],
    options: async ({ auth, searchValue }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };

        // BEST PRACTICE: Use the /search endpoint for performance.
        const response = await httpClient.sendRequest<{ data: StripeCustomer[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/customers/search`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            // BEST PRACTICE: Use searchValue to filter results as the user types.
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
    // This dropdown will refresh when a customer is selected.
    refreshers: ['customerid'], 
    options: async ({ auth, customerid }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };
        if (!customerid) return { disabled: true, options: [], placeholder: 'Please select a customer first' };

        // NOTE: Subscriptions do not have a /search endpoint, so we list them but filter by customer.
        const response = await httpClient.sendRequest<{ data: StripeSubscription[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/subscriptions`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            // CORRECTED: Parameters for a GET request must be in queryParams, not body.
            queryParams: {
                limit: '100',
                status: 'active',
                customer: customerid as string
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

        // NOTE: Payouts do not have a /search endpoint, so we list the latest ones.
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

export const chargeIdDropdown = Property.Dropdown({
    displayName: 'Charge',
    required: true,
    refreshers: ['customerid'],
    options: async ({ auth, customerid }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };
        if (!customerid) return { disabled: true, options: [], placeholder: 'Please select a customer first' };

        // BEST PRACTICE: Filter charges by customer to narrow down the list significantly.
        const response = await httpClient.sendRequest<{ data: { id: string, amount: number, currency: string, created: number }[] }>({
            method: HttpMethod.GET,
            url: `https://api.stripe.com/v1/charges`,
            authentication: { type: AuthenticationType.BEARER_TOKEN, token: auth as string },
            queryParams: {
                limit: '100',
                customer: customerid as string
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

export const paymentLinkIdDropdown = Property.Dropdown({
    displayName: 'Payment Link',
    description: 'Select an active payment link.',
    required: true,
    refreshers: [],
    options: async ({ auth }): Promise<DropdownState<string>> => {
        if (!auth) return { disabled: true, options: [], placeholder: 'Please connect your account' };
        // NOTE: Payment Links do not have a /search endpoint, so we list the latest active ones.
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