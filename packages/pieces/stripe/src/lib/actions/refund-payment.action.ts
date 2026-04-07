import { Property, createAction } from '@activepieces/pieces-framework';
import { createStripeInstance } from '../common/utils';
import { stripeAuth } from '../'; // Import the shared authentication object
import Stripe from 'stripe';

export const refundPayment = createAction({
    auth: stripeAuth, // Uses the Stripe API key defined at the piece level
    name: 'refund_payment',
    displayName: 'Refund Payment',
    description: 'Refunds a payment intent via the Stripe API. Optionally specify an amount or reason.',
    props: {
        paymentId: Property.ShortText({
            displayName: 'Payment ID',
            description: 'The ID of the Payment Intent to refund (e.g., pi_XXXXXXXXXXXXXX).',
            required: true,
        }),
        amount: Property.Number({
            displayName: 'Amount (Optional)',
            description: 'The amount to refund in cents (e.g., 100 for $1.00). If not provided, the entire payment intent will be refunded.',
            required: false,
        }),
        reason: Property.Dropdown({
            displayName: 'Reason (Optional)',
            description: 'Reason for the refund.',
            required: false,
            defaultValue: 'requested_by_customer',
            options: {
                options: [
                    { label: 'Duplicate', value: 'duplicate' },
                    { label: 'Fraudulent', value: 'fraudulent' },
                    { label: 'Requested by customer', value: 'requested_by_customer' },
                ],
            },
        }),
    },
    async run(context) {
        const { paymentId, amount, reason } = context.propsValue;
        const stripe = createStripeInstance(context.auth.access_token);

        const refundOptions: Stripe.RefundCreateParams = {
            payment_intent: paymentId,
        };

        if (amount !== undefined && amount !== null) {
            if (amount <= 0) {
                throw new Error('Refund amount must be a positive number.');
            }
            // Stripe expects amount in cents, so ensure it's an integer.
            // If the user provides a float, it should ideally be converted or rounded.
            // For simplicity, we assume the user provides an integer or we floor it.
            refundOptions.amount = Math.floor(amount); 
        }

        if (reason) {
            // Stripe's RefundCreateParams.Reason is a union type, ensuring type safety here.
            refundOptions.reason = reason as Stripe.RefundCreateParams.Reason;
        }

        try {
            const refund = await stripe.refunds.create(refundOptions);
            return refund; // Returns the full Stripe refund object on success
        } catch (error: unknown) {
            // Comprehensive error handling for Stripe API errors
            if (error instanceof Stripe.StripeError) {
                let errorMessage = `Stripe API Error: ${error.message}`;
                if (error.code) {
                    errorMessage += `. Code: ${error.code}`;
                }
                if (error.param) {
                    errorMessage += `. Param: ${error.param}`;
                }
                if (error.type) {
                    errorMessage += `. Type: ${error.type}`;
                }
                throw new Error(errorMessage);
            }
            // Handle any other unexpected errors
            throw new Error(`Failed to refund payment: ${(error as Error).message || 'An unknown error occurred.'}`);
        }
    },
});