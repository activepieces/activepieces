import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { listQuickActionsOutputSchema } from '../../output-schemas';

export const listQuickActions = createAction({
	auth: salesforceAuth,
	name: 'list_quick_actions',
	classification: 'READ',
	displayName: 'List Quick Actions',
	description: 'List global quick actions, or the quick actions of one object.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists quick actions (e.g. LogACall, NewTask, custom create/update actions) either globally or for one object. Pass the returned names unchanged to Get Quick Action Defaults and Run Quick Action. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listQuickActionsOutputSchema,
	props: {
		object: Property.ShortText({
			displayName: 'Object',
			description: 'Object API name, e.g. Account. Leave empty for global quick actions.',
			required: false,
		}),
	},
	async run(context) {
		const object = context.propsValue.object?.trim();
		const path = object
			? `sobjects/${salesforceUtils.assertApiName({ value: object, fieldName: 'Object' })}/quickActions`
			: 'quickActions';
		const response = await callSalesforceApi(HttpMethod.GET, context.auth, `/services/data/v56.0/${path}`, undefined);
		const body: unknown = response.body;
		const actions = (Array.isArray(body) ? body : []).filter(salesforceUtils.isRecord).map((action) => ({
			name: action['name'] ?? null,
			label: action['label'] ?? null,
			type: action['type'] ?? null,
		}));
		return { actions, count: actions.length };
	},
});
