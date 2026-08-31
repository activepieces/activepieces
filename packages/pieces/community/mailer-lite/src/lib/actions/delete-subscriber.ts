import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteCommon } from '../common';
import { deleteSubscriberOutputSchema } from '../output-schemas';

export const deleteSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_subscriber',
	classification: 'WRITE',
	displayName: 'Delete Subscriber',
	description: 'Permanently delete a subscriber.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently delete a MailerLite subscriber by ID, removing the record and its history. This cannot be undone; prefer Unsubscribe Subscriber for ordinary opt-outs. Returns no content. Idempotent in effect: deleting an already-deleted subscriber leaves the account in the same state.',
		idempotent: true,
	},
	outputSchema: deleteSubscriberOutputSchema,
	props: {
		subscriberId: mailerLiteCommon.subscriberId(true),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		await client.subscribers.delete(context.propsValue.subscriberId!);
		return { deleted: true, subscriberId: context.propsValue.subscriberId };
	},
});
