import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { runQuickActionOutputSchema } from '../../output-schemas';

export const runQuickAction = createAction({
	auth: salesforceAuth,
	name: 'run_quick_action',
	classification: 'WRITE',
	displayName: 'Run Quick Action',
	description: 'Run a global or object-specific quick action with the given field values.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Executes a quick action (e.g. LogACall, NewContact) and returns the id of the record it created or updated. Find names with List Quick Actions and pre-filled fields with Get Quick Action Defaults; pass the name exactly as listed (Object.Action or a bare global name) and a Context Record ID when the action acts on a parent record. Not idempotent: each call creates again.',
		idempotent: false,
	},
	outputSchema: runQuickActionOutputSchema,
	props: {
		action_name: Property.ShortText({
			displayName: 'Quick Action Name',
			description: 'Name exactly as returned by List Quick Actions: Object.Action for object-specific actions (e.g. Account.NewContact), a bare name for global ones (e.g. LogACall).',
			required: true,
		}),
		context_id: Property.ShortText({
			displayName: 'Context Record ID',
			description: 'Id of the parent record the action runs against. Optional.',
			required: false,
		}),
		record: Property.Json({
			displayName: 'Fields',
			description: 'JSON object of field API names to values, e.g. {"Subject": "Call", "Description": "Notes"}.',
			required: true,
		}),
	},
	async run(context) {
		const actionName = context.propsValue.action_name
			.trim()
			.split('.')
			.map((part) => salesforceUtils.assertApiName({ value: part, fieldName: 'Quick Action Name' }))
			.join('.');
		const contextId = context.propsValue.context_id?.trim()
			? salesforceUtils.assertId({ value: context.propsValue.context_id, fieldName: 'Context Record ID' })
			: undefined;
		const record = salesforceUtils.parseJsonObject({ value: context.propsValue.record, fieldName: 'Fields' }) ?? {};
		const [objectName] = actionName.split('.');
		const path = actionName.includes('.') ? `sobjects/${objectName}/quickActions/${actionName}` : `quickActions/${actionName}`;
		const response = await callSalesforceApi(HttpMethod.POST, context.auth, `/services/data/v56.0/${path}`, {
			...(contextId ? { contextId } : {}),
			record,
		});
		const body: unknown = response.body;
		const result = salesforceUtils.isRecord(body) ? body : {};
		return {
			id: result['id'] ?? null,
			success: result['success'] ?? true,
			created: result['created'] ?? null,
			context_id: result['contextId'] ?? contextId ?? null,
			feed_item_ids: result['feedItemIds'] ?? null,
			errors: result['errors'] ?? [],
		};
	},
});
