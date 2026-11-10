import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { codaAuth } from '../auth';
import { codaApi } from '../common/client';
import { codaProps } from '../common/ai-props';
import { triggerAutomationActionOutputSchema } from '../output-schemas';

export const triggerAutomationAction = createAction({
	auth: codaAuth,
	name: 'trigger_automation',
	classification: 'WRITE',
	displayName: 'Trigger Automation',
	description: 'Runs a doc automation whose trigger is "Webhook invoked", optionally passing a JSON payload.',
	audience: 'both',
	aiMetadata: {
		description: 'Runs a Coda automation rule set to "Webhook invoked", passing an optional JSON payload the rule can read. The rule does whatever the doc owner configured (edit rows, notify people). Use only for that rule ID. Not idempotent: each call runs the rule again.',
		idempotent: false,
	},
	props: {
		docId: codaProps.docId(),
		ruleId: Property.ShortText({
			displayName: 'Automation Rule ID',
			description: 'In the doc, open Automations, pick the rule with the "Webhook invoked" trigger, and copy its rule ID (it looks like grid-auto-xxxx).',
			required: true,
		}),
		payload: Property.Json({
			displayName: 'Payload',
			description: 'Optional JSON object the automation can read as its webhook payload.',
			required: false,
		}),
	},
	outputSchema: triggerAutomationActionOutputSchema,
	async run(context) {
		const { docId, ruleId, payload } = context.propsValue;
		const body = codaApi.parseJsonInput({ value: payload, label: 'Payload' });
		const response = await codaApi.request<{ requestId?: string }>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `${codaApi.docPath(docId)}/hooks/automation/${codaApi.pathSegment({ value: ruleId, label: 'Automation Rule ID' })}`,
			operation: 'trigger automation',
			body: body ?? {},
		});
		return { ruleId: ruleId.trim(), requestId: response.requestId ?? null };
	},
});
