import { createAction } from '@activepieces/pieces-framework';

import { mauticRemoveContactUtmTagsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRemoveContactUtmTagsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_remove_contact_utm_tags',
	outputSchema: mauticRemoveContactUtmTagsOutputSchema,
	displayName: 'Remove Contact UTM Tags',
	description: 'Removes one UTM tag entry from a Mautic contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			"Removes one UTM tag entry from a contact. The UTM id is the id of an entry in the contact's utmtags, from Get Contact.",
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		utmId: mauticAiProps.recordId({
			displayName: 'UTM Id',
			description: 'Id of the UTM tag entry, from the utmtags of Get Contact.',
		}),
	},
	async run(context) {
		return await mauticApi.removeContactUtmTags({
			auth: context.auth,
			id: context.propsValue.id,
			utmId: context.propsValue.utmId,
		});
	},
});
