import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { JWT, OAuth2Client } from 'google-auth-library';

export const googleDocsScopes = [
	'https://www.googleapis.com/auth/documents',
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/drive',
	'email',
];

export const googleDocsAuth = [PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://accounts.google.com/o/oauth2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	required: true,
	scope: googleDocsScopes,
}), PieceAuth.CustomAuth({
	displayName: 'Service Account (Advanced)',
	description: `Connect with a Google Cloud service account.

**How to get the key:**
1. Open the [Google Cloud console](https://console.cloud.google.com/iam-admin/serviceaccounts) → **IAM & Admin** → **Service Accounts**.
2. Create a service account, or pick an existing one.
3. Open **Keys** → **Add key** → **Create new key** → **JSON** and download the file.
4. Share each document with the service account's email, or set up [domain-wide delegation](https://support.google.com/a/answer/162106) and fill in **User Email** below.`,
	required: true,
	props: {
		serviceAccount: Property.LongText({
			displayName: 'Service Account JSON Key',
			required: true,
			description: 'Paste the full contents of the downloaded key file.',
		}),
		userEmail: Property.ShortText({
			displayName: 'User Email',
			required: false,
			description: 'Email address of the user to impersonate for domain-wide delegation.',
		}),
	},
	validate: async ({ auth }) => {
		try {
			await getAccessToken({
				type: AppConnectionType.CUSTOM_AUTH,
				props: { ...auth },
			});
		} catch (e) {
			return {
				valid: false,
				error: (e as Error).message,
			};
		}
		return {
			valid: true,
		};
	},
})];

export type GoogleDocsAuthValue = AppConnectionValueForAuthProperty<typeof googleDocsAuth>;

export async function createGoogleClient(auth: GoogleDocsAuthValue): Promise<OAuth2Client> {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		let serviceAccount;
		try {
			serviceAccount = JSON.parse(auth.props.serviceAccount);
		} catch {
			throw new Error('Invalid Service Account JSON Key. Please provide a valid JSON string.');
		}
		return new JWT({
			email: serviceAccount.client_email,
			key: serviceAccount.private_key,
			scopes: googleDocsScopes,
			subject: auth.props.userEmail,
		});
	}
	const authClient = new OAuth2Client();
	authClient.setCredentials(auth);
	return authClient;
}

export const getAccessToken = async (auth: GoogleDocsAuthValue): Promise<string> => {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		const googleClient = await createGoogleClient(auth);
		const response = await googleClient.getAccessToken();
		if (response.token) {
			return response.token;
		} else {
			throw new Error('Could not retrieve access token from service account json');
		}
	}
	return auth.access_token;
};
