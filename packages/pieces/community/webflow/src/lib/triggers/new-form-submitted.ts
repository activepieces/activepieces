import { webflowCommon } from '../common/common';
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowProps } from '../common/props';

const triggerNameInStore = 'webflow_created_form_submissions_trigger';

export const webflowNewSubmission = createTrigger({
	auth: webflowAuth,

	name: 'new_submission',
	displayName: 'New Submission',
	description: 'Triggers when Webflow Site receives a new submission',
	props: {
		site_id: webflowProps.site_id,
		formName: Property.ShortText({
			displayName: 'Form Name',
			required: false,
			description: 'Copy from the form settings, or from one of the responses',
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	// TODO remove and force testing as the data can be custom.
	sampleData: {
		name: 'Sample Form',
		site: '62749158efef318abc8d5a0f',
		data: {
			field_one: 'mock valued',
		},
		d: '2022-09-14T12:35:16.117Z',
		_id: '6321ca84df3949bfc6752327',
	},
	async onEnable(context) {
		const formSubmissionTag = 'form_submission';

		const res = await webflowCommon.subscribeWebhook(
			context.propsValue['site_id']!,
			formSubmissionTag,
			context.webhookUrl,
			getAccessTokenOrThrow(context.auth),
		);
		await context.store?.put<WebhookInformation>(triggerNameInStore, {
			webhookId: res.body._id,
		});
	},
	async onDisable(context) {
		const response = await context.store?.get<WebhookInformation>(triggerNameInStore);
		if (response !== null && response !== undefined) {
			await webflowCommon.unsubscribeWebhook(
				context.propsValue['site_id']!,
				response.webhookId,
				getAccessTokenOrThrow(context.auth),
			);
		}
	},
	async run(context) {
		const body = context.payload.body as PayloadBody;
		const { formName } = context.propsValue;
		//if formName provided, trigger only required formName if it's matched; else trigger all forms in selected webflow site.
		if (formName) {
			if (body.name == formName) {
				return [body];
			} else {
				return [];
			}
		} else {
			return [body];
		}
	},
});

interface WebhookInformation {
	webhookId: string;
}

type PayloadBody = {
	name: string;
};
