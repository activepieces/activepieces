import { Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

type StripeObject = {
    id: string;
    name: string | null;
    email?: string | null;
}

// Helper type for the Price object, including the expanded product
type StripePrice = {
    id: string;
    unit_amount: number;
    currency: string;
    nickname: string | null;
    recurring: {
        interval: string;
    } | null;
    product: StripeObject; // Expanded product object
}

type StripeSubscription = { id: string; customer: StripeObject; items: { data: { price: StripePrice }[] } }

type StripeInvoice = { id: string; number: string | null; customer: StripeObject | null; total: number; currency: string; }

type StripePayout = { id: string; amount: number; currency: string; arrival_date: number; status: string; }

type StripeCharge = { id: string; amount: number; currency: string; customer: StripeObject | null; created: number; }

type StripePaymentLink = { id: string; url: string; line_items: { data: { price: StripePrice }[] } }

export const stripeProps = {
    customer: (required = true) => Property.Dropdown({
        displayName: "Customer",
        description: "The ID of the customer.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Stripe account first",
                    options: [],
                };
            }
            const response = await httpClient.sendRequest<{ data: StripeObject[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/customers`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: { limit: "100" }
            });
            const options = response.body.data.map((item) => {
                const label = item.name ?? item.email ?? item.id;
                return { label, value: item.id, };
            });
            return { disabled: false, options, };
        },
    }),

    product: (required = true) => Property.Dropdown({
        displayName: "Product",
        description: "The product for which to create a price.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    placeholder: "Please connect your Stripe account first",
                    options: [],
                };
            }
            const response = await httpClient.sendRequest<{ data: StripeObject[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/products`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: { limit: "100" }
            });
            const options = response.body.data.map((item) => {
                return { label: item.name ?? item.id, value: item.id, };
            });
            return { disabled: false, options, };
        },
    }),

    price: (required = true) => Property.Dropdown({
        displayName: "Price",
        description: "The ID of the price object to subscribe the customer to.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: "Please connect your Stripe account first", options: [] };
            }
            const response = await httpClient.sendRequest<{ data: StripePrice[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/prices`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: { limit: "100", expand: "data.product" }
            });
            const options = response.body.data.map((price) => {
                const amount = (price.unit_amount / 100).toLocaleString(undefined, { style: 'currency', currency: price.currency });
                let label = `${amount}`;
                if (price.recurring) {
                    label += ` / ${price.recurring.interval}`;
                } else {
                    label += ' (One-Time)';
                }
                if (price.product && price.product.name) {
                    label += ` - (${price.product.name})`;
                }
                return {
                    label: label,
                    value: price.id,
                };
            });
            return { disabled: false, options, placeholder: "Select a Price" };
        },
    }),


    /**
     * Creates a dropdown property to select a Stripe Subscription.
     */
    subscription: (required = true) => Property.Dropdown({
        displayName: "Subscription",
        description: "The ID of the subscription.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: "Please connect your Stripe account first", options: [] };
            }

            const response = await httpClient.sendRequest<{ data: StripeSubscription[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/subscriptions`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: {
                    status: 'active',
                    limit: '100',
                    // FIX: Format the 'expand' array into separate parameters
                    'expand[0]': 'data.customer',
                    'expand[1]': 'data.items.data.price.product'
                }
            });
            const options = response.body.data.map((sub) => {
                const customer = sub.customer;
                const customerIdentifier = customer.name ?? customer.email ?? customer.id;
                const productNames = sub.items.data.map((item) => item.price?.product?.name ?? 'Unknown Product').join(', ');
                
                let label = `Subscription for ${customerIdentifier}`;
                if (productNames) {
                    label += ` (${productNames})`;
                }
                return {
                    label: label,
                    value: sub.id,
                };
            });
            return { disabled: false, options, placeholder: "Select a Subscription" };
        },
    }),


    invoice: (required = true) => Property.Dropdown({
        displayName: "Invoice",
        description: "The ID of the invoice to retrieve.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: "Please connect your Stripe account first", options: [] };
            }

            const response = await httpClient.sendRequest<{ data: StripeInvoice[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/invoices`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: {
                    limit: '100',
                    'expand[0]': 'data.customer'
                }
            });
            const options = response.body.data.map((invoice) => {
                const customer = invoice.customer;
                const customerIdentifier = customer?.name ?? customer?.email ?? customer?.id ?? 'Unknown Customer';
                const amount = (invoice.total / 100).toLocaleString(undefined, { style: 'currency', currency: invoice.currency });
                
                let label = `Invoice ${invoice.number ?? invoice.id}`;
                label += ` for ${customerIdentifier} (${amount})`;

                return {
                    label: label,
                    value: invoice.id,
                };
            });
            return { disabled: false, options, placeholder: "Select an Invoice" };
        },
    }),

    /**
     * Creates a dropdown property to select a Stripe Payout.
     */
    payout: (required = true) => Property.Dropdown({
        displayName: "Payout",
        description: "The ID of the payout to retrieve.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: "Please connect your Stripe account first", options: [] };
            }

            const response = await httpClient.sendRequest<{ data: StripePayout[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/payouts`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: { limit: '100' }
            });

            const options = response.body.data.map((payout) => {
                const amount = (payout.amount / 100).toLocaleString(undefined, { style: 'currency', currency: payout.currency });
                // Convert Unix timestamp (seconds) to milliseconds for Date object
                const arrivalDate = new Date(payout.arrival_date * 1000).toLocaleDateString();
                const label = `${amount} on ${arrivalDate} (Status: ${payout.status})`;
                
                return {
                    label: label,
                    value: payout.id,
                };
            });
            return { disabled: false, options, placeholder: "Select a Payout" };
        },
    }),

    /**
     * Creates a dropdown property to select a Stripe Charge.
     */
    charge: (required = true) => Property.Dropdown({
        displayName: "Charge",
        description: "The charge to refund.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: "Please connect your Stripe account first", options: [] };
            }

            const response = await httpClient.sendRequest<{ data: StripeCharge[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/charges`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: {
                    limit: '100',
                    'expand[0]': 'data.customer'
                }
            });

            const options = response.body.data.map((charge) => {
                const amount = (charge.amount / 100).toLocaleString(undefined, { style: 'currency', currency: charge.currency });
                const createdDate = new Date(charge.created * 1000).toLocaleDateString();
                const customer = charge.customer;
                const customerIdentifier = customer?.name ?? customer?.email ?? 'No Customer';

                const label = `${amount} from ${customerIdentifier} on ${createdDate}`;
                
                return {
                    label: label,
                    value: charge.id,
                };
            });
            return { disabled: false, options, placeholder: "Select a Charge to Refund" };
        },
    }),

    /**
     * Creates a dropdown property to select an active Stripe Payment Link.
     */
    paymentLink: (required = true) => Property.Dropdown({
        displayName: "Payment Link",
        description: "The active payment link to deactivate.",
        required,
        refreshers: [],
        options: async ({ auth }) => {
            if (!auth) {
                return { disabled: true, placeholder: "Please connect your Stripe account first", options: [] };
            }

            const response = await httpClient.sendRequest<{ data: StripePaymentLink[] }>({
                method: HttpMethod.GET,
                url: `https://api.stripe.com/v1/payment_links`,
                headers: { Authorization: `Bearer ${auth}` },
                queryParams: {
                    limit: '100',
                    active: 'true', // Only fetch active links
                    'expand[0]': 'data.line_items.data.price.product'
                }
            });

            const options = response.body.data.map((link) => {
                const productNames = link.line_items.data.map((item) => item.price?.product?.name ?? 'Unknown Product').join(', ');
                const label = `Link for "${productNames || 'product(s)'}" (${link.id})`;
                
                return {
                    label: label,
                    value: link.id,
                };
            });
            return { disabled: false, options, placeholder: "Select an Active Payment Link" };
        },
    }),
};