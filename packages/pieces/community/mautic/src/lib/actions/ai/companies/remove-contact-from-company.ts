import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticRemoveContactFromCompanyAction = createAction({
	auth: mauticAuth,
	name: 'mautic_remove_contact_from_company',
	outputSchema: mauticAdjustContactPointsOutputSchema,
	displayName: 'Remove Contact from Company',
	description: 'Removes a contact from a Mautic company.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Unlinks a contact from a company. Repeating it leaves the contact unlinked.',
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
			change: 'remove',
		});
	},
});
