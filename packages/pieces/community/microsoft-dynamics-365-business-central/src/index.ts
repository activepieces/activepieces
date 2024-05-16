import { createAction, createPiece, PieceAuth } from '@activepieces/pieces-framework';

export const businessCentralAuth = PieceAuth.OAuth2({
	required: true,
	scope: [
		'https://api.businesscentral.dynamics.com/user_impersonation',
		'https://api.businesscentral.dynamics.com/Financials.ReadWrite.All',
	],
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
});

const testAction = createAction({
	auth: businessCentralAuth,
	name: 'test-action',
	displayName: 'Test Action',
	description: 'Test Action',
	props: {},
	async run(context) {
		return context;
	},
});

export const microsoftDynamics365BusinessCentral = createPiece({
	displayName: 'Microsoft Dynamics 365 Business Central',
	auth: businessCentralAuth,
	minimumSupportedRelease: '0.20.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-365-business-central.png',
	authors: ['kishanprmr'],
	actions: [testAction],
	triggers: [],
});
