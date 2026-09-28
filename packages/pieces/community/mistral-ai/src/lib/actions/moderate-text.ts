import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { moderationUtils, ModerationResponse } from '../common/moderation';
import { moderateTextOutputSchema } from '../output-schemas';

export const moderateText = createAction({
	auth: mistralAuth,
	name: 'moderate_text',
	classification: 'READ',
	displayName: 'Moderate Text',
	description: 'Check one or more texts for harmful content.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Classifies one or more plain texts against Mistral’s moderation categories (sexual, hate, violence, self-harm, PII and more) and returns per-text flags and scores plus the list of flagged categories. Use this for standalone text; use Moderate Chat when the content is a conversation so the assistant turn is judged in context. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: moderateTextOutputSchema,
	props: {
		texts: Property.Array({
			displayName: 'Texts',
			description: 'One or more texts to check. Each is scored separately.',
			required: true,
		}),
		model: Property.ShortText({
			displayName: 'Model',
			required: true,
			defaultValue: 'mistral-moderation-latest',
		}),
	},
	async run(context) {
		const texts = mistralApi.toStringArray(context.propsValue.texts);
		if (texts.length === 0) {
			throw new Error('Provide at least one text.');
		}
		const response = await mistralApi.call<ModerationResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/moderations',
			body: { model: context.propsValue.model, input: texts },
		});
		return moderationUtils.formatResponse({ response, inputs: texts });
	},
});
