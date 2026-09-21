import { createAction } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookGetSupportedTimeZonesActionOutputSchema } from '../output-schemas';

export const outlookGetSupportedTimeZonesAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_supported_time_zones',
	classification: 'READ',
	displayName: 'Get Supported Time Zones',
	description: 'Lists the time zones Outlook accepts for this account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists the time zone names Outlook accepts, so a time zone string can be validated before it is used elsewhere. Works on delegated connections only: Microsoft exposes no application permission for it, so app-only connections are rejected with an explanatory error. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	outputSchema: outlookGetSupportedTimeZonesActionOutputSchema,
	async run(context) {
		if (outlookAtomicCommon.isAppOnlyConnection(context.auth)) {
			throw new Error(
				'Listing the supported time zones is available on delegated Outlook connections only. Microsoft Graph exposes no application permission for this endpoint, so an app-only connection with a configured mailbox cannot call it.',
			);
		}

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const response: PageCollection = await client
				.api(`${prefix}/outlook/supportedTimeZones`)
				.get();

			const timeZones = (response.value ?? []) as Array<Record<string, unknown>>;

			return {
				timeZones,
				count: timeZones.length,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Listing the supported Outlook time zones',
			});
		}
	},
});
