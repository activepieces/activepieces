import {
	AuthenticationType,
	HttpMethod,
	createCustomApiCallAction,
	httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askAssistant } from './lib/actions/ask-assistant';
import { generateImage } from './lib/actions/generate-image';
import { askOpenAI } from './lib/actions/send-prompt';
import { textToSpeech } from './lib/actions/text-to-speech';
import { transcribeAction } from './lib/actions/transcriptions';
import { translateAction } from './lib/actions/translation';
import { visionPrompt } from './lib/actions/vision-prompt';
import { baseUrl } from './lib/common/common';
import { extractStructuredDataAction } from './lib/actions/extract-structure-data.action';

const markdownDescription = `
Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`;

export const openaiAuth = PieceAuth.SecretText({
	description: markdownDescription,
	displayName: 'API Key',
	required: true,
	validate: async (auth) => {
		try {
			await httpClient.sendRequest<{
				data: { id: string }[];
			}>({
				url: `${baseUrl}/models`,
				method: HttpMethod.GET,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.auth as string,
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API key',
			};
		}
	},
});

export const openai = createPiece({
	displayName: 'OpenAI',
	description: 'Use the many tools ChatGPT has to offer.',
	minimumSupportedRelease: '0.5.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
	auth: openaiAuth,
	actions: [
		askOpenAI,
		askAssistant,
		generateImage,
		visionPrompt,
		textToSpeech,
		transcribeAction,
		translateAction,
		extractStructuredDataAction,
		createCustomApiCallAction({
			auth: openaiAuth,
			baseUrl: () => baseUrl,
			authMapping: (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	authors: [
		'aboudzein',
		'astorozhevsky',
		'Willianwg',
		'Nilesh',
		'Salem-Alaa',
		'kishanprmr',
		'MoShizzle',
		'khaledmashaly',
		'abuaboud',
	],
	triggers: [],
});
