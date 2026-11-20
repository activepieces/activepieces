import { DropdownState, Property, tryCatch } from '@activepieces/pieces-framework';

import { opnformAuth } from '../auth';
import { opnformApi } from './api';

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace',
	description = 'Workspace the form belongs to.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: opnformAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your Opnform account first' });
			}
			const { data: workspaces, error } = await tryCatch(() => opnformApi.listWorkspaces({ auth }));
			if (error) {
				return disabledOptions({ placeholder: 'Failed to load workspaces. Check your connection.' });
			}
			if (workspaces.length === 0) {
				return { disabled: false, options: [], placeholder: 'No workspaces found' };
			}
			return {
				disabled: false,
				placeholder: 'Select workspace',
				options: workspaces.map((workspace) => ({ label: workspace.name, value: workspace.id })),
			};
		},
	});
}

function formId<R extends boolean>({
	required,
	displayName = 'Form',
	description = 'Form in the selected workspace.',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: opnformAuth,
		displayName,
		description,
		required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect your Opnform account first' });
			}
			if (!workspaceId) {
				return disabledOptions({ placeholder: 'Select a workspace first' });
			}
			const { data: forms, error } = await tryCatch(() =>
				opnformApi.listForms({ auth, workspaceId: String(workspaceId) }),
			);
			if (error) {
				return disabledOptions({ placeholder: 'Failed to load forms. Check your connection.' });
			}
			if (forms.length === 0) {
				return { disabled: false, options: [], placeholder: 'No forms in this workspace' };
			}
			return {
				disabled: false,
				placeholder: 'Select form',
				options: forms.map((form) => ({ label: form.title, value: form.id })),
			};
		},
	});
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
	return { disabled: true, options: [], placeholder };
}

export const opnformProps = { workspaceId, formId };

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
