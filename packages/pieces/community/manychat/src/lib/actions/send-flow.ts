import { createAction } from '@activepieces/pieces-framework';
import { manychatAuth } from '../auth';
import { manychatClient, manychatUtils } from '../common/client';
import { manychatInput, manychatProps } from '../common/props';
import { manychatOutputSchemas } from '../common/output-schemas';

export const sendFlowAction = createAction({
	auth: manychatAuth,
	name: 'send_flow',
	classification: 'WRITE',
	displayName: 'Send Flow to Subscriber',
	description:
		'Starts a ManyChat flow for a subscriber. The subscriber must be inside the messaging window, and ManyChat allows at most 100 flow sends per subscriber per hour. The flow must be published in ManyChat; drafts appear in the list but can\'t be sent.',
	audience: 'both',
	aiMetadata: {
		description:
			'Starts a published ManyChat flow for one subscriber by subscriber ID and flow namespace (ns from "List Flows"). Use to run a prepared multi-step conversation; for a single ad-hoc message use "Send Content to User". The subscriber must be inside the 24-hour messaging window, and ManyChat caps sends at 100 per subscriber per hour. The flow must be published in ManyChat; drafts appear in the list but can\'t be sent. Each call starts the flow again.',
		idempotent: false,
	},
	outputSchema: manychatOutputSchemas.sendFlow,
	props: {
		subscriber_id: manychatProps.subscriberIdText(),
		flow_ns: manychatProps.flowDropdown(),
	},
	async run({ auth, propsValue }) {
		const id = manychatInput.subscriberIdText({ value: propsValue.subscriber_id });
		const flowNs = manychatInput.optionalText(propsValue.flow_ns);
		if (flowNs === undefined) {
			throw new Error('Flow is required.');
		}
		await manychatClient.request({
			apiKey: manychatUtils.apiKeyOf(auth),
			method: 'POST',
			path: '/sending/sendFlow',
			operation: 'send flow',
			body: { subscriber_id: manychatInput.apiId(id), flow_ns: flowNs },
		});
		return { status: 'success', flow_ns: flowNs, subscriber_id: id };
	},
});
