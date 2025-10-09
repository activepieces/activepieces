import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../../index';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { searchFieldProp, searchFieldValueProp } from '../common/props';
import { DEAL_OPTIONAL_FIELDS } from '../common/constants';

export const findDealAction = createAction({
	auth: pipedriveAuth,
	name: 'find-deal',
	displayName: 'Find Deal',
	description: 'Finds a deal by any field.',
	props: {
		searchField: searchFieldProp('deal'),
		searchFieldValue: searchFieldValueProp('deal'),
	},
	async run(context) {
		const { searchField } = context.propsValue;
		const fieldValue = context.propsValue.searchFieldValue['field_value'];

		if (isNil(fieldValue)) {
			throw new Error('Please enter a value for the field');
		}

		const filter = await pipedriveApiCall<{ data: { id: number } }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/v1/filters',
			body: {
				name: `Activepieces Find Deal Filter`,
				type: 'deals',
				conditions: {
					glue: 'and',
					conditions: [
						{
							glue: 'and',
							conditions: [
								{
									object: 'deal',
									field_id: searchField,
									operator: '=',
									value: fieldValue,
								},
							],
						},
						{
							glue: 'or',
							conditions: [
								{
									object: 'deal',
									field_id: searchField,
									operator: 'IS NOT NULL',
									value: null,
								},
							],
						},
					],
				},
			},
		});

		// Search for deals using the created filter

		const deals = await pipedriveApiCall<{ data: { id: number }[] }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/deals',
			query: {
				filter_id: filter.data.id,
				limit: 1,
				sort_by: 'update_time',
				sort_direction: 'desc',
				include_fields: DEAL_OPTIONAL_FIELDS.join(','),
			},
		});

		// Delete the temporary filter
		await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.DELETE,
			resourceUri: `/v1/filters/${filter.data.id}`,
		});

		if (isNil(deals.data) || deals.data.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/dealFields',
		});

		const updatedDealProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			deals.data[0],
		);

		return {
			found: true,
			data: [updatedDealProperties],
		};
	},
});
