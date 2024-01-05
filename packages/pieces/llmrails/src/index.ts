import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { datastoreSearch } from './lib/actions/datastore-search';

const markdownDescription = `
Follow these instructions to get your LLMRails API Key:

1. Visit the following website: https://console.llmrails.com/api-keys.
2. Once on the website, click on create a key.
3. Once you have created a key, copy it and use it for the Api key field on the site.
`;

export const llmrailsAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: markdownDescription,
	required: true,
	validate: async ({auth}) => {
		if(auth.startsWith('api_')){
			return {
				valid: true,
			}
		}
		return {
			valid: false,
			error: 'Invalid Api Key'
		}
	}
});

export const llmrails = createPiece({
	displayName: "LLMRails",
	minimumSupportedRelease: '0.5.0',
	logoUrl: "https://cdn.activepieces.com/pieces/llmrails.png",
	authors: ["w95"],
	auth: llmrailsAuth,
	actions: [datastoreSearch],
	triggers: []
});