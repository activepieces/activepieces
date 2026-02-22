import { PieceAuth } from '@activepieces/pieces-framework';
import { zagoMailApiService } from './common/request';

export const zagomailAuth = PieceAuth.SecretText({
	displayName: 'Application Public Key',
	required: true,
	description:
		'Please provide your application public key by generating one in your zagomail account settings or by directly visiting https://app.zagomail.com/user/api-keys/index.',
	validate: async ({ auth }) => {
		try {
			const response = await zagoMailApiService.getAllLists(auth);

			if (response.status !== 'success') {
				return {
					valid: false,
					error: 'Invalid Public Key.',
				};
			}
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid Public Key.',
			};
		}
	},
});
