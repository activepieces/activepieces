import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createRecordAction } from './lib/actions/create-record.action';
import { getRecordAction } from './lib/actions/get-record.action';
import { updateRecordAction } from './lib/actions/update-record.action';
import { deleteRecordAction } from './lib/actions/delete-record.action';

export const businessCentralAuth = PieceAuth.OAuth2({
	props: {
		environment: Property.ShortText({
			displayName: 'Environment',
			description: `Name of the environment to connect to, e.g. 'Production' or 'Sandbox'. Environment names can be found in the Business Central Admin Center.`,
			required: true,
			defaultValue: 'Production',
		}),
	},
	required: true,
	scope: [
		'https://api.businesscentral.dynamics.com/user_impersonation',
		'https://api.businesscentral.dynamics.com/Financials.ReadWrite.All',
	],
	authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
});

export const microsoftDynamics365BusinessCentral = createPiece({
	displayName: 'Microsoft Dynamics 365 Business Central',
	auth: businessCentralAuth,
	minimumSupportedRelease: '0.20.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/microsoft-dynamics-365-business-central.png',
	authors: ['kishanprmr'],
	actions: [createRecordAction, deleteRecordAction, getRecordAction, updateRecordAction],
	triggers: [],
});
