import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListActiveCallsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_active_calls',
	displayName: 'List Active Calls',
	description: 'Lists the calls currently in progress on a connection.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of calls currently in progress on a connection, with each call_control_id, leg and session id, client state and duration so far. Use a call_control_id with the call control actions such as Hangup Call or Speak Text.',
		idempotent: true,
	},
	props: {
		connectionId: telnyxAiProps.connectionId({ required: true }),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listActiveCalls({
			auth: context.auth,
			connectionId: p.connectionId,
			query: telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
		});
	},
});
