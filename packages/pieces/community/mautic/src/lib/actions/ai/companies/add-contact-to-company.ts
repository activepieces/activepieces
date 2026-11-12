import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticAddContactToCompanyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_add_contact_to_company',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Add Contact to Company',
	description: 'Adds a contact to a Mautic company.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Links a contact to a company. Repeating it leaves the link as is.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Company Id',
			description: 'Numeric company id, from List Companies or Create Company.',
		}),
		contactId: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts.',
		}),
	},
	async run(context) {
		return await mauticApi.changeMembership({
			auth: context.auth,
			resource: 'companies',
			id: context.propsValue.id,
			contactId: context.propsValue.contactId,
			change: 'add',
		});
	},
});
