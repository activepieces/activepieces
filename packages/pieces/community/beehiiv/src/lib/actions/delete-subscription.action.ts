import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { beehiivAuth } from '../common/auth';
import { publicationId, subscriptionId } from '../common/props';
import { beehiivApiCall } from '../common/client';

export const deleteSubscriptionAction = createAction({
	auth: beehiivAuth,
	name: 'delete_subscription',
	displayName: 'Delete Subscription',
	description: 'Permanently deletes a subscription from a Beehiiv publication.',
	audience: 'both',
	aiMetadata: { description: 'Permanently deletes a subscription from a beehiiv publication, identified by publication ID and subscription ID. Use to remove a subscriber entirely (distinct from unsubscribing, which Update Subscription handles). Idempotent in effect — once deleted, repeating the call leaves the subscriber absent, though a subsequent call may error on the missing ID.', idempotent: true },
	props: {
		publicationId: publicationId,
		subscriptionId: subscriptionId(true),
	},
	async run(context) {
		const { publicationId, subscriptionId } = context.propsValue;

		const response = await beehiivApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/publications/${publicationId}/subscriptions/${subscriptionId}`,
		});

		return response;
	},
});
