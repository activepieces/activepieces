import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookFocusedInboxOverrideActionOutputSchema } from '../output-schemas';

export const outlookCreateFocusedInboxOverrideAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_create_focused_inbox_override',
	classification: 'WRITE',
	displayName: 'Create Focused Inbox Override',
	description: 'Forces mail from a sender into the Focused or Other tab.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Pins future mail from one sender address to the Focused or the Other tab. Microsoft upserts by sender address: if an override already exists for that address, its classification is updated instead of a duplicate being created, and the stored display name is left untouched unless Sender Display Name is supplied. Idempotent for that reason. Use Update Focused Inbox Override when you already hold an override ID.',
		idempotent: true,
	},
	props: {
		senderEmailAddress: Property.ShortText({
			displayName: 'Sender Email Address',
			description: 'SMTP address of the sender the override applies to.',
			required: true,
		}),
		classifyAs: Property.StaticDropdown({
			displayName: 'Classify As',
			required: true,
			defaultValue: 'focused',
			options: {
				disabled: false,
				options: [
					{ label: 'Focused', value: 'focused' },
					{ label: 'Other', value: 'other' },
				],
			},
		}),
		senderName: Property.ShortText({
			displayName: 'Sender Display Name',
			description: 'Optional display name stored alongside the override.',
			required: false,
		}),
	},
	outputSchema: outlookFocusedInboxOverrideActionOutputSchema,
	async run(context) {
		const { senderEmailAddress, classifyAs, senderName } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client.api(`${prefix}/inferenceClassification/overrides`).post({
				classifyAs,
				senderEmailAddress: {
					...(senderName ? { name: senderName } : {}),
					address: senderEmailAddress,
				},
			});
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Creating the Focused Inbox override',
			});
		}
	},
});
