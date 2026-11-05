import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxGetBlackBoxTestResultsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_black_box_test_results',
	displayName: 'Get Black Box Test Results',
	description: 'Gets Telnyx black box test results per product.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets the latest Telnyx black box (synthetic monitoring) test results for each product, useful to check whether a Telnyx service is degraded. Filter by product.',
		idempotent: true,
	},
	props: {
		product: Property.ShortText({
			displayName: 'Product',
			description: 'Only results for this product, e.g. "messaging".',
			required: false,
		}),
	},
	async run(context) {
		const results = await telnyxApi.getBlackBoxTestResults({
			auth: context.auth,
			query: telnyxUtils.filterQuery({
				filters: { product: context.propsValue.product },
			}),
		});
		return { results, count: results.length };
	},
});
