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
import { ORGANIZATION_OPTIONAL_FIELDS } from '../common/constants';

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
			resourceUri: '/v1/filters',
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

		const organizations = await pipedriveApiCall<{ data: { id: number }[] }>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v2/organizations',
			query: {
				filter_id: filter.data.id,
				limit: 1,
				sort_by: 'update_time',
				sort_direction: 'desc',
				include_fields: ORGANIZATION_OPTIONAL_FIELDS.join(','),
			},
		});

		// delete the filter
		await pipedriveApiCall({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.DELETE,
			resourceUri: `/v1/filters/${filter.data.id}`,
		});

		if (isNil(organizations.data) || organizations.data.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/v1/organizationFields',
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
