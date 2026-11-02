import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDeleteFocusedInboxOverrideActionOutputSchema } from '../output-schemas';

export const outlookDeleteFocusedInboxOverrideAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_delete_focused_inbox_override',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Focused Inbox Override',
	description: 'Removes a Focused Inbox sender override.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one Focused Inbox override so mail from that sender is classified by Outlook again. The override ID comes from List Focused Inbox Overrides. Not idempotent: repeating the call with the same ID fails once the override is gone.',
		idempotent: false,
	},
	props: {
		overrideId: Property.ShortText({
			displayName: 'Override ID',
			description: 'Override ID from List Focused Inbox Overrides.',
			required: true,
		}),
	},
	outputSchema: outlookDeleteFocusedInboxOverrideActionOutputSchema,
	async run(context) {
		const { overrideId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(
					`${prefix}/inferenceClassification/overrides/${outlookAtomicCommon.encodeGraphId(
						overrideId,
					)}`,
				)
				.delete();

			return {
				success: true,
				message: 'Focused Inbox override deleted.',
				overrideId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Deleting the Focused Inbox override',
			});
		}
	},
});
