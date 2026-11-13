import { createAction, Property } from '@activepieces/pieces-framework';

import { opnformAuth } from '../../../auth';
import { opnformAiProps } from '../../../common/ai-props';
import { opnformApi } from '../../../common/api';
import { opnformCreateSubmissionOutputSchema } from '../../../output-schemas';

export const opnformCreateSubmissionAction = createAction({
	auth: opnformAuth,
	name: 'opnform_create_submission',
	outputSchema: opnformCreateSubmissionOutputSchema,
	displayName: 'Create Submission',
	description: 'Submits answers to a public form.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Submits answers to a public form, as if someone filled it in, so the form's active integrations may fire. Answers are keyed by field id from Get Form. Draft, closed, password- or captcha-protected forms may reject it. Not idempotent: each call adds a submission.",
		idempotent: false,
	},
	props: {
		formSlug: opnformAiProps.formSlug({ required: true }),
		answers: Property.Json({
			displayName: 'Answers',
			description:
				'JSON object of answers keyed by field id (from Get Form), e.g. {"3700d380-197b-47b9-a008-3acc31bbd506": "Alice", "12461db5-0c19-429e-840b-8de1e359c42f": "alice@example.com"}. Text fields take strings, number fields numbers, checkboxes booleans, multi-selects arrays.',
			required: true,
		}),
		completionTime: Property.Number({
			displayName: 'Completion Time',
			description: 'Optional time spent filling the form, in seconds.',
			required: false,
		}),
		trackingParameters: Property.Json({
			displayName: 'Tracking Parameters',
			description:
				'Optional campaign attribution, e.g. {"utm_source": "newsletter", "utm_campaign": "summer-launch"}. Supported keys: utm_source, utm_medium, utm_campaign, utm_id, utm_term, utm_content, gclid, fbclid and similar click ids.',
			required: false,
		}),
	},
	async run(context) {
		const { formSlug, answers, completionTime, trackingParameters } = context.propsValue;
		return await opnformApi.createSubmission({
			auth: context.auth,
			formSlug,
			body: {
				...answers,
				...(completionTime !== undefined ? { completion_time: completionTime } : {}),
				...(trackingParameters !== undefined ? { tracking_parameters: trackingParameters } : {}),
			},
		});
	},
});
