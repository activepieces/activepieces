import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_contact',
	outputSchema: mauticGetContactOutputSchema,
	displayName: 'Update Contact',
	description: 'Updates fields of a Mautic contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates only the fields given on an existing contact; fields left empty are not changed. Fails if the contact id does not exist. Tags are added, and a tag prefixed with "-" is removed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
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
		const { id, additionalFields, email, firstname, lastname, owner, tags } = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'contacts',
			id,
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
