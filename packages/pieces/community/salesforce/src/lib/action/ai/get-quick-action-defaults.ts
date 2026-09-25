import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../../..';
import { callSalesforceApi } from '../../common';
import { salesforceUtils } from '../../common/utils';
import { getQuickActionDefaultsOutputSchema } from '../../output-schemas';

export const getQuickActionDefaults = createAction({
	auth: salesforceAuth,
	name: 'get_quick_action_defaults',
	classification: 'READ',
	displayName: 'Get Quick Action Defaults',
	description: 'Get the default field values a quick action would pre-fill.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the field values a quick action pre-fills, optionally in the context of a parent record (e.g. an Account id for Account.NewContact). Call it before Run Quick Action to see which fields to send. Names come from List Quick Actions. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: getQuickActionDefaultsOutputSchema,
	props: {
		action_name: Property.ShortText({
			displayName: 'Quick Action Name',
			description: 'Name exactly as returned by List Quick Actions: Object.Action for object-specific actions (e.g. Account.NewContact), a bare name for global ones (e.g. LogACall).',
			required: true,
		}),
		context_id: Property.ShortText({
			displayName: 'Context Record ID',
			description: 'Id of the record the action runs against. Optional.',
			required: false,
		}),
	},
	async run(context) {
		const actionName = assertQuickActionName(context.propsValue.action_name);
		const contextId = context.propsValue.context_id?.trim()
			? `/${salesforceUtils.assertId({ value: context.propsValue.context_id, fieldName: 'Context Record ID' })}`
			: '';
		const response = await callSalesforceApi(
			HttpMethod.GET,
			context.auth,
			`/services/data/v56.0/${quickActionPath(actionName)}/defaultValues${contextId}`,
			undefined
		);
		return salesforceUtils.cleanRecord(response.body);
	},
});

function quickActionPath(actionName: string): string {
	const [objectName] = actionName.split('.');
	return actionName.includes('.') ? `sobjects/${objectName}/quickActions/${actionName}` : `quickActions/${actionName}`;
}

function assertQuickActionName(value: string): string {
	return value
		.trim()
		.split('.')
		.map((part) => salesforceUtils.assertApiName({ value: part, fieldName: 'Quick Action Name' }))
		.join('.');
}
