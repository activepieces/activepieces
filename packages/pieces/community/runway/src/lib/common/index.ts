export * from './auth';
export * from './client';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayRequest } from './client';

export const runwayModelProperty = Property.Dropdown<string>({
	displayName: 'Model',
	required: true,
	refreshers: ['auth'],
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, placeholder: 'Connect your Runway account', options: [] };
		}
		try {
			const apiKey = auth as string;
			const data = await runwayRequest<{ data: Array<{ id: string; name?: string }> }>({
				apiKey,
				method: HttpMethod.GET,
				resource: '/v1/models',
				versionHeader: '2024-06-01',
			});
			const options = (data?.data || []).map((m) => ({ label: m.name || m.id, value: m.id }));
			if (options.length === 0) {
				return { disabled: true, placeholder: 'No models available', options: [] };
			}
			return { options };
		} catch {
			return { disabled: true, placeholder: 'Unable to load models', options: [] };
		}
	},
});

export const runwayTaskIdProperty = Property.Dropdown<string>({
	displayName: 'Task',
	required: true,
	refreshers: ['auth'],
	options: async ({ auth }) => {
		if (!auth) {
			return { disabled: true, placeholder: 'Connect your Runway account', options: [] };
		}
		try {
			const apiKey = auth as string;
			const resp = await runwayRequest<{ data: Array<{ id: string; status?: string; created_at?: string }> }>({
				apiKey,
				method: HttpMethod.GET,
				resource: '/v1/tasks',
				versionHeader: '2024-06-01',
			});
			const options = (resp?.data || []).slice(0, 50).map((t) => ({
				label: `${t.id}${t.status ? ` (${t.status})` : ''}`,
				value: t.id,
			}));
			if (options.length === 0) {
				return { disabled: true, placeholder: 'No tasks found', options: [] };
			}
			return { options };
		} catch {
			return { disabled: true, placeholder: 'Unable to load tasks', options: [] };
		}
	},
});


