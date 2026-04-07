import Stripe from 'stripe';

/**
 * Creates and returns a new Stripe client instance.
 * @param apiKey Your Stripe secret API key.
 * @returns A Stripe client instance.
 */
export function createStripeInstance(apiKey: string): Stripe {
    // It's good practice to use a consistent API version across the piece.
    // This example uses a recent stable version.
    return new Stripe(apiKey, {
        apiVersion: '2022-11-15', // Using a recent stable API version
    });
}