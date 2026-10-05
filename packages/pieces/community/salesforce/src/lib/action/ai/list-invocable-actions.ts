import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { listInvocableActionsOutputSchema } from '../../output-schemas';

export const listInvocableActions = createAction({
	auth: salesforceAuth,
	name: 'list_invocable_actions',
	classification: 'READ',
	displayName: 'List Invocable Actions',
	description: 'List the standard or custom invocable actions (flows, Apex, email alerts…) available in the org.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists invocable actions you can call with Run Invocable Action. Scope standard returns built-in actions (e.g. emailSimple, postToChatter); scope custom with no type returns the available custom action types (flow, apex, quickAction, emailAlert…), and with a type returns the actions of that type. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listInvocableActionsOutputSchema,
	props: {
		scope: Property.StaticDropdown({
			displayName: 'Scope',
			required: true,
			defaultValue: 'standard',
			options: {
				options: [
					{ label: 'Standard', value: 'standard' },
					{ label: 'Custom', value: 'custom' },
				],
			},
		}),
		custom_type: Property.ShortText({
			displayName: 'Custom Action Type',
			description: 'For custom scope: flow, apex, quickAction, emailAlert… Leave empty to list the available types.',
			required: false,
		}),
	},
	async run(context) {
		const customType = context.propsValue.custom_type?.trim();
		const path =
			context.propsValue.scope === 'custom'
				? `custom${customType ? `/${salesforceUtils.assertApiName({ value: customType, fieldName: 'Custom Action Type' })}` : ''}`
				: 'standard';
		const response = await callSalesforceApi(HttpMethod.GET, context.auth, `/services/data/v56.0/actions/${path}`, undefined);
		const body: unknown = response.body;
		if (salesforceUtils.isRecord(body) && Array.isArray(body['actions'])) {
			const actions = body['actions'].filter(salesforceUtils.isRecord).map((action) => ({
				name: action['name'] ?? null,
				label: action['label'] ?? null,
				type: action['type'] ?? null,
				url: action['url'] ?? null,
			}));
			return { actions, count: actions.length };
		}
		const types = salesforceUtils.isRecord(body)
			? Object.entries(body).map(([type, url]) => ({ name: type, label: type, type: 'actionType', url }))
			: [];
		return { actions: types, count: types.length };
	},
});
