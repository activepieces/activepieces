import { createAction, Property } from '@activepieces/pieces-framework';
import { salesforceAuth } from '../../..';
import { crmUtils } from '../../common/crm';
import { createSfNoteOutputSchema } from '../../output-schemas';

export const createSfNote = createAction({
	auth: salesforceAuth,
	name: 'create_sf_note',
	classification: 'WRITE',
	displayName: 'Create Note',
	description: 'Attach a note to a record.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Attaches a classic Salesforce Note (title and plain-text body, up to 32 KB) to any record such as an Account, Contact, Lead, Opportunity or Case, optionally private to the owner. Use Create Task or Log Call for activities instead of free-text notes. Not idempotent: each call adds another note.',
		idempotent: false,
	},
	outputSchema: createSfNoteOutputSchema,
	props: {
		ParentId: Property.ShortText({ displayName: 'Parent Record ID', description: 'The record the note belongs to.', required: true }),
		Title: Property.ShortText({ displayName: 'Title', required: true }),
		Body: Property.LongText({ displayName: 'Body', required: false }),
		IsPrivate: Property.Checkbox({ displayName: 'Private', description: 'Only the owner and admins can see it.', required: false }),
	},
	async run(context) {
		const fields = context.propsValue;
		const result = await crmUtils.createRecord({ auth: context.auth, object: 'Note', fields, additionalFields: undefined });
		return { ...result, parent_id: fields.ParentId, title: fields.Title };
	},
});
