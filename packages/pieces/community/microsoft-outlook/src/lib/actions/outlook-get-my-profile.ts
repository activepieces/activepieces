import { createAction } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookGetMyProfileActionOutputSchema } from '../output-schemas';

export const outlookGetMyProfileAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_my_profile',
	classification: 'READ',
	displayName: 'Get My Profile',
	description: 'Reads the identity of the connected account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the identity behind the connection: display name, primary email address and user principal name. Use this to learn your own address before composing mail, filtering a thread or deciding whether a sender is you. On app-only connections it reports the configured mailbox without calling Microsoft Graph, because reading another user profile would need a directory permission this piece does not request. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {},
	outputSchema: outlookGetMyProfileActionOutputSchema,
	async run(context) {
		if (outlookAtomicCommon.isAppOnlyConnection(context.auth)) {
			const mailbox = outlookAtomicCommon.getConfiguredMailbox(context.auth);
			return {
				id: null,
				displayName: null,
				mail: mailbox,
				userPrincipalName: mailbox,
				source: 'connection-mailbox',
			};
		}

		const client = outlookCommon.createClient(context.auth);

		try {
			const profile = await client.api('/me?$select=id,displayName,mail,userPrincipalName').get();

			return {
				id: profile?.['id'] ?? null,
				displayName: profile?.['displayName'] ?? null,
				mail: profile?.['mail'] ?? null,
				userPrincipalName: profile?.['userPrincipalName'] ?? null,
				source: 'graph',
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Reading the Outlook profile' });
		}
	},
});
