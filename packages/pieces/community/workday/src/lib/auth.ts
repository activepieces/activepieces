import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const workdayAuth = PieceAuth.OAuth2({
	props: {
		tenant: Property.ShortText({
			displayName: 'Tenant',
			description:
				'Your Workday tenant identifier (e.g., "ibmsrv_pt1"). Found in your Workday URL.',
			required: true,
		}),
		isuUsername: Property.ShortText({
			displayName: 'ISU Username (for write operations)',
			description:
				'Integration System User username for SOAP API write operations (create, update, hire). Format: username@tenant',
			required: false,
		}),
		isuPassword: PieceAuth.SecretText({
			displayName: 'ISU Password (for write operations)',
			description:
				'Integration System User password for SOAP API write operations.',
			required: false,
		}),
	},
	required: true,
	description: 'Authenticate with Workday',
	authUrl: 'https://impl.workday.com/{tenant}/authorize',
	tokenUrl:
		'https://wd2-impl-services1.workday.com/ccx/oauth2/{tenant}/token',
	scope: ['staffing', 'expenses', 'timeTracking', 'resourceManagement'],
});
