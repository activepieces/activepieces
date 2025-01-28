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

export const findOrganizationAction = createAction({
	auth: pipedriveAuth,
	name: 'find-organization',
	displayName: 'Find Organization',
	description: 'Finds an organization.',
	props: {
		searchField: searchFieldProp('organization'),
		searchFieldValue: searchFieldValueProp('organization'),
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
				name: 'Activepieces Find Organization Filter',
				type: 'org',
				conditions: {
					glue: 'and',
					conditions: [
						{
							glue: 'and',
							conditions: [
								{
									object: 'organization',
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
									object: 'organization',
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

		// search for organizations using the filter
		const organizations = await pipedriveApiCall<{ data: { id: number }[] }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizations',
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

		if (isNil(organizations.data) || organizations.data.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/organizationFields',
		});

		const updatedOrganizationProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			organizations.data[0],
		);

		return {
			found: true,
			data: [updatedOrganizationProperties],
		};
	},
});
