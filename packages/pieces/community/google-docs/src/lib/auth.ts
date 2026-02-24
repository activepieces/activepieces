import { PieceAuth } from '@activepieces/pieces-framework';

export const googleDocsAuth = PieceAuth.OAuth2({
	authUrl: 'https://accounts.google.com/o/oauth2/auth',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	required: true,
	scope: [
		'https://www.googleapis.com/auth/documents',
		'https://www.googleapis.com/auth/drive.readonly',
		'https://www.googleapis.com/auth/drive',
	],
});
