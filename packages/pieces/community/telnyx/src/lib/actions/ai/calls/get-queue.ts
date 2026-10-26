import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';

export const telnyxGetQueueAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_queue',
	displayName: 'Get Queue',
	description: 'Gets a call queue.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one call queue by name: current size, max size and average wait time.',
		idempotent: true,
	},
	props: {
		queueName: Property.ShortText({
			displayName: 'Queue Name',
			description: 'Queue name. Use List Queues to find it.',
			required: true,
		}),
	},
	async run(context) {
		return await telnyxApi.getQueue({
			auth: context.auth,
			queueName: context.propsValue.queueName,
		});
	},
});
