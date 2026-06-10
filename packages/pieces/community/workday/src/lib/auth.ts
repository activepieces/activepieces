import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const workdayAuth = PieceAuth.OAuth2({
	props: {
		authHost: Property.ShortText({
			displayName: 'Authorization Host',
			description:
				'The host for OAuth authorization (e.g., "impl.workday.com" for sandbox). Found in your Authorization Endpoint URL.',
			required: true,
			defaultValue: 'impl.workday.com',
		}),
		apiHost: Property.ShortText({
			displayName: 'API Host',
			description:
				'Your Workday API/services host (e.g., "wd2-impl-services1.workday.com" for sandbox). Found in your Token Endpoint or REST API Endpoint URL.',
			required: true,
			defaultValue: 'wd2-impl-services1.workday.com',
		}),
		tenant: Property.ShortText({
			displayName: 'Tenant',
			description:
				'Your Workday tenant identifier. Found in your Workday URL.',
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
	authUrl: 'https://{authHost}/{tenant}/authorize',
	tokenUrl:
		'https://{apiHost}/ccx/oauth2/{tenant}/token',
	scope: ['staffing', 'expenses', 'timeTracking', 'resourceManagement'],
});
