import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { runInvocableActionOutputSchema } from '../../output-schemas';

export const runInvocableAction = createAction({
	auth: salesforceAuth,
	name: 'run_invocable_action',
	classification: 'WRITE',
	displayName: 'Run Invocable Action',
	description: 'Run a standard or custom invocable action, such as an autolaunched flow or Apex action.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Invokes a standard action (e.g. emailSimple) or a custom action (flow, apex, emailAlert…) with one or more input sets and returns each invocation\'s success, errors and output values. Find names and types with List Invocable Actions; flows must be active and autolaunched, and for Apex the name is the class name. Not idempotent: each call runs the action again.',
		idempotent: false,
	},
	outputSchema: runInvocableActionOutputSchema,
	props: {
		action_type: Property.ShortText({
			displayName: 'Custom Action Type',
			description: 'flow, apex, quickAction, emailAlert… Leave empty for a standard action.',
			required: false,
		}),
		action_name: Property.ShortText({
			displayName: 'Action Name',
			description: 'Action API name, e.g. emailSimple or My_Autolaunched_Flow.',
			required: true,
		}),
		inputs: Property.Json({
			displayName: 'Inputs',
			description: 'JSON array of input objects, one per invocation (a single object is also accepted), e.g. [{"recordId": "001..."}].',
			required: false,
		}),
	},
	async run(context) {
		const actionName = salesforceUtils.assertApiName({ value: context.propsValue.action_name, fieldName: 'Action Name' });
		const rawType = context.propsValue.action_type?.trim();
		const actionType = rawType && rawType.toLowerCase() !== 'standard' ? rawType : undefined;
		const path = actionType
			? `custom/${salesforceUtils.assertApiName({ value: actionType, fieldName: 'Custom Action Type' })}/${actionName}`
			: `standard/${actionName}`;
		const inputs = parseInputs(context.propsValue.inputs);
		const response = await callSalesforceApi(HttpMethod.POST, context.auth, `/services/data/v56.0/actions/${path}`, { inputs });
		const body: unknown = response.body;
		const results = (Array.isArray(body) ? body : []).filter(salesforceUtils.isRecord).map((result) => ({
			action_name: result['actionName'] ?? actionName,
			is_success: result['isSuccess'] === true,
			errors: formatErrors(result['errors']),
			output_values: result['outputValues'] ?? null,
		}));
		const failures = results.filter((result) => !result.is_success);
		if (results.length > 0 && failures.length === results.length) {
			throw new Error(`Action ${actionName} failed: ${failures.map((failure) => failure.errors.join('; ')).join(' | ')}`);
		}
		return { results, count: results.length, failed_count: failures.length };
	},
});

function parseInputs(value: unknown): unknown[] {
	if (salesforceUtils.isRecord(value)) {
		return [value];
	}
	if (typeof value === 'string' && value.trim().startsWith('{')) {
		const single = salesforceUtils.parseJsonObject({ value, fieldName: 'Inputs' });
		return single ? [single] : [{}];
	}
	const list = salesforceUtils.parseJsonArray({ value, fieldName: 'Inputs' });
	return list && list.length > 0 ? list : [{}];
}

function formatErrors(errors: unknown): string[] {
	if (!Array.isArray(errors)) {
		return [];
	}
	return errors.map((error) =>
		salesforceUtils.isRecord(error) ? String(error['message'] ?? error['statusCode'] ?? JSON.stringify(error)) : String(error)
	);
}
