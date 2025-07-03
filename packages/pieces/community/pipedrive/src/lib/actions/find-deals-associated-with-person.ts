import { pipedriveAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { personIdProp } from '../common/props';
import { pipedrivePaginatedApiCall, pipedriveTransformCustomFields } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { GetField } from '../common/types';

export const findDealsAssociatedWithPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'find-deals-associated-with-person',
	displayName: 'Find Deals Associated With Person',
	description: 'Finds multiple deals related to a specific person.',
	props: {
		personId: personIdProp(true),
	},
	async run(context) {
		const { personId } = context.propsValue;

		const deals = await pipedrivePaginatedApiCall<Record<string, any>>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/persons/${personId}/deals`,
			query: { sort: 'update_time DESC' },
		});

		if (isNil(deals) || deals.length == 0) {
			return {
				found: false,
				data: [],
			};
		}

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/dealFields',
		});

		const result = [];
		for (const deal of deals) {
			const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
			result.push(updatedDealProperties);
		}

		return {
			found: true,
			data: result,
		};
	},
});
