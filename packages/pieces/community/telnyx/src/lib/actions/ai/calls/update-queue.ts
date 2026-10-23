import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxUpdateQueueAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_queue',
	displayName: 'Update Queue',
	description: 'Changes the maximum size of a call queue.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the maximum number of calls a queue can hold. Setting the same size again changes nothing.',
		idempotent: true,
	},
	props: {
		queueName: Property.ShortText({
			displayName: 'Queue Name',
			description: 'Queue name. Use List Queues to find it.',
			required: true,
		}),
		maxSize: Property.Number({
			displayName: 'Max Size',
			description: 'New maximum calls in the queue (1-5000).',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.updateQueue({
			auth: context.auth,
			queueName: context.propsValue.queueName,
			maxSize: context.propsValue.maxSize,
		});
	},
});
