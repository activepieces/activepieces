import { HttpMethod } from '@activepieces/pieces-common';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { zohoDeskApiCall } from '.';
import { zohoDeskAuth } from './auth';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const organizationId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		refreshers: [],
		required: params.required,
		options: async ({ auth }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
					options: [],
					disabled: true,
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof zohoDeskAuth>;

			const response = await zohoDeskApiCall<{ data: { id: string; companyName: string }[] }>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: '/organizations',
			});

			return {
				disabled: false,
				options: response.data.map((org) => {
					return {
						label: org.companyName,
						value: org.id,
					};
				}),
			};
		},
	});

export const departmentId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		refreshers: ['orgId'],
		required: params.required,
		options: async ({ auth, orgId }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
					options: [],
					disabled: true,
				};
			}

			if (!orgId) {
				return {
					placeholder: 'Please select organization first.',
					options: [],
					disabled: true,
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof zohoDeskAuth>;

			const response = await zohoDeskApiCall<{ data: { id: string; name: string }[] }>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: `/departments`,
				orgId: orgId as string,
			});

			return {
				disabled: false,
				options: response.data.map((department) => {
					return {
						label: department.name,
						value: department.id,
					};
				}),
			};
		},
	});
