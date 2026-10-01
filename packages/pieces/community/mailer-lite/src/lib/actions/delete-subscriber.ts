import MailerLite from '@mailerlite/mailerlite-nodejs';
import { createAction } from '@activepieces/pieces-framework';
import { mailerLiteAuth } from '../auth';
import { mailerLiteCommon } from '../common';
import { mailerLiteApi } from '../common/client';
import { deleteSubscriberOutputSchema } from '../output-schemas';

export const deleteSubscriberAction = createAction({
	auth: mailerLiteAuth,
	name: 'delete_subscriber',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Subscriber',
	description: 'Delete a subscriber. MailerLite keeps their data in case they re-subscribe.',
	audience: 'both',
	aiMetadata: {
		description:
			'Delete a MailerLite subscriber by ID. MailerLite keeps their data in case they re-subscribe; use forget_subscriber to permanently erase it (GDPR), or unsubscribe_subscriber for an ordinary opt-out. Not idempotent: a repeat call on a deleted subscriber returns a 404 error.',
		idempotent: false,
	},
	outputSchema: deleteSubscriberOutputSchema,
	props: {
		subscriberId: mailerLiteCommon.subscriberId(true),
	},
	async run(context) {
		const client = new MailerLite({ api_key: context.auth.secret_text });
		await client.subscribers.delete(context.propsValue.subscriberId!).catch((error: unknown) => {
			throw mailerLiteApi.readableSdkError({ error, resource: `subscriber ${context.propsValue.subscriberId}` });
		});
		return { deleted: true, subscriberId: context.propsValue.subscriberId };
	},
});
