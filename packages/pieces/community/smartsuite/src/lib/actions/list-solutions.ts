import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { smartSuitePaginatedApiCall } from '../common';
import { outputSchemas } from '../output-schemas';

export const listSolutions = createAction({
	name: 'list_solutions',
	classification: 'SEARCH',
	displayName: 'List Solutions',
	description: 'Lists the solutions (workspaces of tables) your account can access.',
	audience: 'both',
	aiMetadata: {
		description: 'Returns every SmartSuite solution the connected user can access, with ID, name, status and table/record counts. Use first to find a Solution ID, then List Tables. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		includeHidden: Property.Checkbox({
			displayName: 'Include Hidden Solutions',
			description: 'Also return hidden and system solutions.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: outputSchemas['solutionList'],
	async run({ auth, propsValue }) {
		const solutions = await smartSuitePaginatedApiCall<Record<string, unknown>>({
			apiKey: auth.props.apiKey,
			accountId: auth.props.accountId,
			method: HttpMethod.GET,
			resourceUri: '/solutions/',
			operation: 'list solutions',
		});
		const items = propsValue.includeHidden ? solutions : solutions.filter((solution) => solution['hidden'] !== true);
		return { items, count: items.length };
	},
});
