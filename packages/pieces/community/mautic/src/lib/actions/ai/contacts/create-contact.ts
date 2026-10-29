import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_contact',
	outputSchema: mauticCreateContactOutputSchema,
	displayName: 'Create Contact',
	description: 'Creates a Mautic contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a contact from the given field values. Mautic merges into an existing contact when a unique identifier field (email by default) matches, so the returned contact may be an existing one with updated fields.',
		idempotent: false,
	},
	props: {
		email: Property.ShortText({ displayName: 'Email', required: false }),
		firstname: Property.ShortText({ displayName: 'First Name', required: false }),
		lastname: Property.ShortText({ displayName: 'Last Name', required: false }),
		owner: Property.Number({
			displayName: 'Owner Id',
			description: 'Id of the Mautic user who owns the contact, from List Contact Owners.',
			required: false,
		}),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Tag names to add. Prefix a name with "-" to remove that tag.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other contact fields keyed by field alias, e.g. {"phone": "+15550100", "city": "Berlin"}. Aliases come from List Contact Fields. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { additionalFields, email, firstname, lastname, owner, tags } = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'contacts',
			body: {
				...additionalFields,
				...spreadIfDefined('email', email),
				...spreadIfDefined('firstname', firstname),
				...spreadIfDefined('lastname', lastname),
				...spreadIfDefined('owner', owner),
				...spreadIfDefined('tags', tags),
			},
		});
	},
});
