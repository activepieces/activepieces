import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListQueueCallsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_queue_calls',
	displayName: 'List Queue Calls',
	description: 'Lists the calls waiting in a queue.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of calls waiting in a queue, with their call_control_id, position and wait time. Pass a call_control_id to Bridge Calls to connect it.',
		idempotent: true,
	},
	props: {
		queueName: Property.ShortText({
			displayName: 'Queue Name',
			description: 'Queue name. Use List Queues to find it.',
			required: true,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listQueueCalls({
			auth: context.auth,
			queueName: p.queueName,
			query: telnyxUtils.pageQuery({
				pageNumber: p.pageNumber,
				pageSize: p.pageSize,
			}),
		});
	},
});
