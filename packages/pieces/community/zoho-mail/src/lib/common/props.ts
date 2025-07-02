import { HttpMethod } from '@activepieces/pieces-common';
import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { zohoMailApiCall } from '.';
import { zohoMailAuth } from './auth';

interface DropdownParams {
	displayName: string;
	description?: string;
	required: boolean;
}

export const accountId = (params: DropdownParams) =>
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
			const authValue = auth as PiecePropValueSchema<typeof zohoMailAuth>;

			const response = await zohoMailApiCall<{
				data: { accountId: string; displayName: string }[];
			}>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: '/accounts',
			});

			return {
				disabled: false,
				options: response.data.map((account) => {
					return {
						label: account.displayName || account.accountId,
						value: account.accountId,
					};
				}),
			};
		},
	});

export const folderId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		refreshers: ['accountId'],
		required: params.required,
		options: async ({ auth, accountId }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
					options: [],
					disabled: true,
				};
			}
			if (!accountId) {
				return {
					placeholder: 'Please select Account first.',
					options: [],
					disabled: true,
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof zohoMailAuth>;

			const response = await zohoMailApiCall<{
				data: { folderId: string; path: string }[];
			}>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: `/accounts/${accountId}/folders`,
			});

			return {
				disabled: false,
				options: response.data.map((folder) => {
					return {
						label: folder.path || folder.folderId,
						value: folder.folderId,
					};
				}),
			};
		},
	});

export const messageId = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		refreshers: ['accountId', 'folderId'],
		required: params.required,
		options: async ({ auth, accountId, folderId }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
					options: [],
					disabled: true,
				};
			}
			if (!accountId) {
				return {
					placeholder: 'Please select Account first.',
					options: [],
					disabled: true,
				};
			}
			if (!folderId) {
				return {
					placeholder: 'Please select Folder first.',
					options: [],
					disabled: true,
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof zohoMailAuth>;

			const response = await zohoMailApiCall<{
				data: { messageId: string; subject: string }[];
			}>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: `/accounts/${accountId}/messages/view`,
				query: {
					folderId: folderId as string,
					limit: 50,
				},
			});

			return {
				disabled: false,
				options: response.data.map((message) => {
					return {
						label: message.subject,
						value: message.messageId,
					};
				}),
			};
		},
	});

export const fromAddress = (params: DropdownParams) =>
	Property.Dropdown({
		displayName: params.displayName,
		description: params.description,
		refreshers: ['accountId'],
		required: params.required,
		options: async ({ auth, accountId }) => {
			if (!auth) {
				return {
					placeholder: 'Please connect your account first.',
					options: [],
					disabled: true,
				};
			}
			if (!accountId) {
				return {
					placeholder: 'Please select Account first.',
					options: [],
					disabled: true,
				};
			}
			const authValue = auth as PiecePropValueSchema<typeof zohoMailAuth>;

			const response = await zohoMailApiCall<{
				data: { sendMailDetails: { fromAddress: string }[] };
			}>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: `/accounts/${accountId}`,
			});

			return {
				disabled: false,
				options: response.data.sendMailDetails.map((account) => {
					return {
						label: account.fromAddress,
						value: account.fromAddress,
					};
				}),
			};
		},
	});
