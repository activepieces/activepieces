import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookFocusedInboxOverrideActionOutputSchema } from '../output-schemas';

export const outlookUpdateFocusedInboxOverrideAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_update_focused_inbox_override',
	classification: 'WRITE',
	displayName: 'Update Focused Inbox Override',
	description: 'Changes the classification of a Focused Inbox override.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Switches an existing Focused Inbox override between the Focused and Other tabs. The classification is the only writable property, and the override ID comes from List Focused Inbox Overrides. Idempotent: applying the same classification again changes nothing.',
		idempotent: true,
	},
	props: {
		overrideId: Property.ShortText({
			displayName: 'Override ID',
			description: 'Override ID from List Focused Inbox Overrides.',
			required: true,
		}),
		classifyAs: Property.StaticDropdown({
			displayName: 'Classify As',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Focused', value: 'focused' },
					{ label: 'Other', value: 'other' },
				],
			},
		}),
	},
	outputSchema: outlookFocusedInboxOverrideActionOutputSchema,
	async run(context) {
		const { overrideId, classifyAs } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(
					`${prefix}/inferenceClassification/overrides/${outlookAtomicCommon.encodeGraphId(
						overrideId,
					)}`,
				)
				.patch({ classifyAs });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Updating the Focused Inbox override',
			});
		}
	},
});
