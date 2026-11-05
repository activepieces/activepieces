import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxCreateQueueAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_queue',
	displayName: 'Create Queue',
	description: 'Creates a call queue.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a named call queue that Enqueue Call can place calls into. Fails if a queue with the same name exists; check with Get Queue first.',
		idempotent: false,
	},
	props: {
		queueName: Property.ShortText({
			displayName: 'Queue Name',
			description: 'Unique queue name, e.g. "support".',
			required: true,
		}),
		maxSize: Property.Number({
			displayName: 'Max Size',
			description: 'Maximum calls in the queue (1-5000). Defaults to 100.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createQueue({
			auth: context.auth,
			body: telnyxUtils.compact({
				values: {
					queue_name: p.queueName,
					max_size: p.maxSize,
				},
			}),
		});
	},
});
