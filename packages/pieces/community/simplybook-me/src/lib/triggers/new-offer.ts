import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const newOfferTrigger = createTrigger({
  auth: simplyBookAuth,
  name: 'new_offer',
  displayName: 'New Offer',
  description: 'Triggers when a new offer (proposal or quote) is created',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 54321,
    client_id: 67890,
    title: 'Website Development Proposal',
    description: 'Complete website development for small business',
    amount: 5000.00,
    currency: 'USD',
    status: 'pending',
    valid_until: '2023-12-15T23:59:59Z',
    created_at: '2023-11-28T14:30:00Z',
  },
  async onEnable(context) {
    // Store the current timestamp to track new offers
    await context.store.put('last_offer_check', new Date().toISOString());
  },
  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('last_offer_check');
  },
  async run(context) {
    const lastCheck = await context.store.get<string>('last_offer_check');
    const now = new Date().toISOString();
    
    const params: Record<string, any> = {
      start_date: lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_date: now,
    };

    const offers = await makeApiRequest(context.auth, 'getOffers', params);
    
    // Filter for offers created since last check
    const newOffers = (offers || []).filter((offer: any) => 
      offer.created_at && offer.created_at > lastCheck
    );
    
    // Update the last check timestamp
    await context.store.put('last_offer_check', now);
    
    return newOffers;
  },
});
