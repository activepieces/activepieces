/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const googleDocsScopes = [
	'https://www.googleapis.com/auth/documents',
	'https://www.googleapis.com/auth/drive.readonly',
	'https://www.googleapis.com/auth/drive',
];

export const googleDocsAuth = [PieceAuth.OAuth2({
	description: '',
	authUrl: 'https://accounts.google.com/o/oauth2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	required: true,
	scope: googleDocsScopes,
}), PieceAuth.CustomAuth({
	displayName: 'Service Account (Advanced)',
	description: 'Authenticate via service account from https://console.cloud.google.com/ > IAM & Admin > Service Accounts > Create Service Account > Keys > Add key.  <br> <br> You can optionally use domain-wide delegation (https://support.google.com/a/answer/162106?hl=en#zippy=%2Cset-up-domain-wide-delegation-for-a-client) to access documents without adding the service account to each one. <br> <br> **Note:** Without a user email, the service account only has access to files/folders you explicitly share with it.',
	required: true,
	props: {
		serviceAccount: Property.ShortText({
			displayName: 'Service Account JSON Key',
			required: true,
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
		const serviceAccount = JSON.parse(auth.props.serviceAccount);
		return new google.auth.JWT({
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

export const docsCommon = {
	baseUrl: 'https://docs.googleapis.com/v1',
	title: Property.ShortText({
		displayName: 'Document Title',
		required: true,
	}),
	body: Property.LongText({
		displayName: 'Document Content',
		required: true,
	}),

	// Creates an empty document with the title provided
	createDocument: async (title: string, accessToken: string) => {
		const createRequest = await httpClient.sendRequest({
			url: `${docsCommon.baseUrl}/documents`,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			body: {
				title: title,
			},
		});

		return createRequest.body;
	},

	// Writes provided content to the end of an existing document
	writeToDocument: async (documentId: string, body: string, accessToken: string) => {
		const writeRequest = await httpClient.sendRequest({
			url: `${docsCommon.baseUrl}/documents/${documentId}:batchUpdate`,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			body: {
				requests: [
					{
						insertText: {
							text: body,
							endOfSegmentLocation: {},
						},
					},
				],
			},
		});

		return writeRequest.body;
	},
};
