import { createAction } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../../index';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { GetField } from '../common/types';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { searchFieldProp, searchFieldValueProp } from '../common/props';

export const findPersonAction = createAction({
	auth: pipedriveAuth,
	name: 'find-person',
	displayName: 'Find Person',
	description: 'Finds a person.',
	props: {
		searchField: searchFieldProp('person'),
		searchFieldValue: searchFieldValueProp('person'),
	},
	async run(context) {
		const { searchField } = context.propsValue;
		const fieldValue = context.propsValue.searchFieldValue['field_value'];

		if (isNil(fieldValue)) {
			throw new Error('Please enter a value for the field');
		}

		// create Filter
		const filter = await pipedriveApiCall<{ data: { id: number } }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.POST,
			resourceUri: '/filters',
			body: {
				name: 'Activepieces Find Person Filter',
				type: 'people',
				conditions: {
					glue: 'and',
					conditions: [
						{
							glue: 'and',
							conditions: [
								{
									object: 'person',
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
									object: 'person',
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

		// search for persons using the filter
		const persons = await pipedriveApiCall<{ data: { id: number }[] }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/persons',
			query: {
				filter_id: filter.data.id,
				limit: 1,
				sort: 'update_time DESC',
			},
		});

		// delete the filter
		await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.DELETE,
			resourceUri: `/filters/${filter.data.id}`,
		});

		if (isNil(persons.data) || persons.data.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/personFields',
		});

		const updatedPersonProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			persons.data[0],
		);

		return {
			found: true,
			data: [updatedPersonProperties],
		};
	},
});
