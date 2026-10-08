import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
Follow these instructions to get your API Key:
1. Visit the following website: https://robolly.com/dashboard/account/
2. Once on the website, locate and copy your API Key.
Please, take into consideration: We don't test your API Key validity in order to save you some generations, so make sure this is the correct one.
`;

export const robollyAuth = PieceAuth.SecretText({
	description: markdownDescription,
	displayName: 'API Key',
	required: true,
	validate: async () => {
		return {
			valid: true,
		};
	},
});
