export * from './auth';
export * from './client';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { runwayRequest } from './client';

export const runwayModelProperty = Property.ShortText({ displayName: 'Model', required: true });

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


