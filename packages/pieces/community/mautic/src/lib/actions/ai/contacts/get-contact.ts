import { createAction } from '@activepieces/pieces-framework';

import { mauticGetContactOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetContactAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_contact',
	outputSchema: mauticGetContactOutputSchema,
	displayName: 'Get Contact',
	description: 'Gets one Mautic contact by id.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets a single contact by its numeric id, with all field values, tags, UTM tags, points, owner and do-not-contact entries. Get the id from List Contacts.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
	},
	async run(context) {
		return await mauticApi.getRecord({
			auth: context.auth,
			resource: 'contacts',
			id: context.propsValue.id,
		});
	},
});
