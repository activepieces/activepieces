import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListVerifiedNumbersAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_verified_numbers',
	displayName: 'List Verified Numbers',
	description: 'Lists phone numbers verified for use as caller ID.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of external phone numbers verified on the account (for use as caller ID), with the time each was verified.',
		idempotent: true,
	},
	props: {
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listVerifiedNumbers({
			auth: context.auth,
			query: telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
		});
	},
});
