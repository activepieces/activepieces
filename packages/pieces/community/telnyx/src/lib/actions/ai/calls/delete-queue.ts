import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxDeleteQueueAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_delete_queue',
	displayName: 'Delete Queue',
	description: 'Deletes a call queue.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a call queue by name. Cannot be undone.',
		idempotent: false,
	},
	props: {
		queueName: Property.ShortText({
			displayName: 'Queue Name',
			description: 'Queue name. Use List Queues to find it.',
			required: true,
		}),
	},
	async run(context) {
		const { queueName } = context.propsValue;
		await telnyxApi.deleteQueue({ auth: context.auth, queueName });
		return { deleted: true, queue_name: queueName };
	},
});
