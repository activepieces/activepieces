
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, DedupeStrategy, Polling, pollingHelper, QueryParams } from '@activepieces/pieces-common';
import { bigcommerceAuth, BigCommerceAuth } from '../common/auth';
import { BigCommerceClient, BigCommerceAbandonedCart } from '../common/client';

const polling: Polling<BigCommerceAuth, Record<string, never>> = {
	strategy: DedupeStrategy.TIMEBASED,
	async items({ auth, lastFetchEpochMS }) {
		const client = new BigCommerceClient(auth);
        
        const query: QueryParams = {
            sort: 'updated_at:desc', 
            limit: '100' 
        };

		const carts = await client.getAbandonedCarts(query);

        const newCarts = carts.filter(cart => 
            new Date(cart.updated_at).getTime() > lastFetchEpochMS
        );

		return newCarts.map((cart) => ({
			epochMilliSeconds: new Date(cart.updated_at).getTime(),
			data: cart,
		}));
	},
};

export const abandonedCart = createTrigger({
    auth: bigcommerceAuth,
    name: 'abandoned_cart',
    displayName: 'Abandoned Cart',
    description: 'Triggers when a cart is abandoned (polls for new abandoned carts).',
    props: {},
    sampleData: {
        "cart_id": "5a1c23d695c530be650f5678",
        "customer_id": 1234,
        "email": "customer@example.com",
        "created_at": "2025-10-28T07:45:00Z",
        "updated_at": "2025-10-28T08:45:00Z"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },

    async test(context) {
        return await pollingHelper.test(polling, context);
    },

    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});