import { DropdownState, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../auth';
import { opnformApi } from './api';

function workspaceId<R extends boolean>({
	required,
	displayName = 'Workspace',
	description = 'Workspace Name',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: opnformAuth,
		displayName,
		description,
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect Opnform account' });
			}
			const workspaces = await opnformApi.listWorkspaces({ auth });
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
	description = 'Form Name',
}: PropParams<R>) {
	return Property.Dropdown({
		auth: opnformAuth,
		displayName,
		description,
		required,
		refreshers: ['workspaceId'],
		options: async ({ auth, workspaceId }) => {
			if (!auth) {
				return disabledOptions({ placeholder: 'Connect Opnform account' });
			}
			if (!workspaceId) {
				return disabledOptions({ placeholder: 'Select workspace' });
			}
			const forms = await opnformApi.listForms({ auth, workspaceId: String(workspaceId) });
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
