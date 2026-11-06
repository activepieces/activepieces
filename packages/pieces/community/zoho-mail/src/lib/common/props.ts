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
		auth: zohoMailAuth,
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

			const options = response.data.map((account) => {
				return {
					label: account.displayName || account.accountId,
					value: account.accountId,
				};
			});

			return {
				disabled: false,
				...(options.length === 0 ? { placeholder: 'No accounts found.' } : {}),
				options,
			};
		},
	});

export const folderId = (params: DropdownParams) =>
	Property.Dropdown({
		auth: zohoMailAuth,
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
					placeholder: 'Please select an account first.',
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

			const options = response.data.map((folder) => {
				return {
					label: folder.path || folder.folderId,
					value: folder.folderId,
				};
			});

			return {
				disabled: false,
				...(options.length === 0 ? { placeholder: 'No folders found.' } : {}),
				options,
			};
		},
	});

export const messageId = (params: DropdownParams) =>
	Property.Dropdown({
		auth: zohoMailAuth,
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
					placeholder: 'Please select an account first.',
					options: [],
					disabled: true,
				};
			}
			if (!folderId) {
				return {
					placeholder: 'Please select a folder first.',
					options: [],
					disabled: true,
				};
			}

			const authValue = auth as PiecePropValueSchema<typeof zohoMailAuth>;

			const response = await zohoMailApiCall<{
				data: { messageId: string; subject: string; fromAddress?: string }[];
			}>({
				auth: authValue,
				method: HttpMethod.GET,
				resourceUri: `/accounts/${accountId}/messages/view`,
				query: {
					folderId: folderId as string,
					limit: 50,
				},
			});

			const options = response.data.map((message) => {
				const subject = message.subject || '(No subject)';
				return {
					label: message.fromAddress ? `${subject} (${message.fromAddress})` : subject,
					value: message.messageId,
				};
			});

			return {
				disabled: false,
				...(options.length === 0 ? { placeholder: 'No emails in this folder.' } : {}),
				options,
			};
		},
	});

export const fromAddress = (params: DropdownParams) =>
	Property.Dropdown({
		auth: zohoMailAuth,
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
					placeholder: 'Please select an account first.',
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

			const options = response.data.sendMailDetails.map((account) => {
				return {
					label: account.fromAddress,
					value: account.fromAddress,
				};
			});

			return {
				disabled: false,
				...(options.length === 0 ? { placeholder: 'No send-from addresses found.' } : {}),
				options,
			};
		},
	});
