import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListQueuesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_queues',
	displayName: 'List Queues',
	description: 'Lists call queues.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of call queues with their name, current size, max size and average wait time. Queue names are what the other queue actions take.',
		idempotent: true,
	},
	props: {
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listQueues({
			auth: context.auth,
			query: telnyxUtils.pageQuery({
				pageNumber: p.pageNumber,
				pageSize: p.pageSize,
			}),
		});
	},
});
