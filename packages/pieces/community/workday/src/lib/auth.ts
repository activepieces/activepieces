import { AppConnectionType, PieceAuth, Property } from '@activepieces/pieces-framework';

import { workdayApi } from './common/api';

const apiHostDescription =
	'Your Workday services host, without https://, e.g. `wd2-impl-services1.workday.com`. It is the host of the Token Endpoint or Workday REST API Endpoint shown in **View API Clients**.';

const tenantDescription =
	'Your Workday tenant name, e.g. `acme_impl`. It is the part after the host in your Workday URL (`https://<host>/<tenant>/...`).';

const wwsVersionProperty = Property.ShortText({
	displayName: 'WWS Version',
	description: 'Workday Web Services (SOAP) version, e.g. `v47.0`. Leave empty for v47.0.',
	required: false,
	defaultValue: 'v47.0',
});

export const workdayOAuth2Auth = PieceAuth.OAuth2({
	props: {
		authHost: Property.ShortText({
			displayName: 'Authorization Host',
			description:
				'The Authorization Endpoint from **View API Clients**, without https:// and without `/<tenant>/authorize`, e.g. `wd2-impl.workday.com` or `impl.wd5.myworkday.com/wday/authgwy`.',
			required: true,
			defaultValue: 'impl.workday.com',
		}),
		apiHost: Property.ShortText({
			displayName: 'API Host',
			description: apiHostDescription,
			required: true,
			defaultValue: 'wd2-impl-services1.workday.com',
		}),
		tenant: Property.ShortText({
			displayName: 'Tenant',
			description: tenantDescription,
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
			description: 'Integration System User password for SOAP API write operations.',
			required: false,
		}),
		wwsVersion: wwsVersionProperty,
	},
	required: true,
	description: 'Authenticate with Workday',
	authUrl: 'https://{authHost}/{tenant}/authorize',
	tokenUrl: 'https://{apiHost}/ccx/oauth2/{tenant}/token',
	scope: ['staffing', 'expenses', 'timeTracking', 'resourceManagement'],
});

export const workdayIsuAuth = PieceAuth.CustomAuth({
	displayName: 'Integration System User',
	description: `Connect with a Workday Integration System User (ISU) instead of OAuth 2.0.

This connection runs SOAP actions (hire, job changes, time off, suppliers, invoices, Call Operation in SOAP mode) and Get Report / Scheduled Report Fetch. Actions that use Workday's REST API or WQL need the OAuth 2.0 connection.

The ISU needs a security group with access to the domains and business processes your flows use. For reports, share the report with the ISU.`,
	required: true,
	props: {
		apiHost: Property.ShortText({
			displayName: 'API Host',
			description: apiHostDescription,
			required: true,
		}),
		tenant: Property.ShortText({
			displayName: 'Tenant',
			description: tenantDescription,
			required: true,
		}),
		username: Property.ShortText({
			displayName: 'Username',
			description:
				'The ISU username, e.g. `isu_activepieces` (`@<tenant>` is added for SOAP when missing).',
			required: true,
		}),
		password: PieceAuth.SecretText({
			displayName: 'Password',
			required: true,
		}),
		wwsVersion: wwsVersionProperty,
	},
	validate: async ({ auth }) => {
		try {
			await workdayApi.getServerTimestamp({
				auth: { type: AppConnectionType.CUSTOM_AUTH, props: auth },
			});
			return { valid: true };
		} catch (e) {
			const message = e instanceof Error ? e.message : String(e);
			if (/invalid username or password/i.test(message)) {
				return { valid: false, error: 'Workday rejected the username or password.' };
			}
			return { valid: false, error: `Could not reach Workday with these details. ${message}` };
		}
	},
});

export const workdayAuth = [workdayOAuth2Auth, workdayIsuAuth];
