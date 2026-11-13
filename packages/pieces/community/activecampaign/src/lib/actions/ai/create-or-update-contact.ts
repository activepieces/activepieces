import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { createOrUpdateContactOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const createOrUpdateContactAiAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_create_or_update_contact',
	classification: 'WRITE',
	displayName: 'Create or Update Contact (AI)',
	description: 'Creates a contact, or updates the one with the same email or ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Upserts a contact: updates the contact with this Contact ID (when given) or this email, or creates it when none exists. Only the fields you send change. Use it for both creating and editing contacts. Safe to repeat with the same input.',
		idempotent: true,
	},
	outputSchema: createOrUpdateContactOutputSchema,
	props: {
		email: Property.ShortText({ displayName: 'Email', description: 'The contact\'s email address. Also the lookup key when Contact ID is empty.', required: true }),
		contact_id: Property.ShortText({
			displayName: 'Contact ID',
			description: 'Optional. Update this contact (and set its email to Email). Use List Contacts to find the ID.',
			required: false,
		}),
		first_name: Property.ShortText({ displayName: 'First Name', required: false }),
		last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', required: false }),
		custom_fields: aiProps.contactCustomFields,
	},
	async run({ auth, propsValue }) {
		const email = aiInput.requireText({ value: propsValue.email, label: 'Email' });
		if (!email.includes('@')) {
			throw new Error(`Email must be an email address (got "${email.slice(0, 50)}").`);
		}
		const contactId = aiInput.optionalNumericId({ value: propsValue.contact_id, label: 'Contact ID' });
		const fieldValues = aiInput.contactFieldValues(aiInput.customFieldEntries({ value: propsValue.custom_fields, label: 'Custom Fields' }));
		const contact = {
			email,
			...(contactId !== undefined ? { id: contactId } : {}),
			firstName: aiInput.optionalText(propsValue.first_name),
			lastName: aiInput.optionalText(propsValue.last_name),
			phone: aiInput.optionalText(propsValue.phone),
			...(fieldValues.length > 0 ? { fieldValues } : {}),
		};
		const response = await makeClient(auth.props).request({
			method: 'POST',
			path: '/contact/sync',
			query: contactId !== undefined ? { lookupByAcId: 'true' } : undefined,
			body: { contact },
		});
		return {
			created: response.status === 201,
			contact: aiOutput.contactSummary(acData.recordAt({ value: response.body, key: 'contact' })),
			fieldValues: acData.recordsAt({ value: response.body, key: 'fieldValues' }).map((record) => aiOutput.idText({ record, keys: ['field', 'value'] })),
		};
	},
});
